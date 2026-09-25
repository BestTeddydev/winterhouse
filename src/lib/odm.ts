/**
 * Minimal Mongoose-compatible model layer backed by Firestore.
 *
 * Supports the subset of Mongoose the app uses: schemas with casting/defaults/validation,
 * find/findOne/findById/findByIdAndUpdate/findOneAndUpdate/findByIdAndDelete/updateMany/
 * countDocuments/create, query chaining (populate/sort/select/lean/skip/limit), document
 * save/populate/toObject, ObjectId, CastError and ValidationError.
 *
 * Filters are evaluated in memory: simple top-level equality conditions are pushed down to
 * Firestore to narrow the read, everything else ($or, $in, ranges, regex, ...) is matched here.
 * This keeps Mongo query semantics without composite indexes, and is fine for collections of
 * a few thousand documents.
 */
import { randomBytes, randomInt } from 'crypto'
import { DocumentReference, DocumentSnapshot, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getDb } from './firebase'

// ---------------------------------------------------------------------------
// ObjectId
// ---------------------------------------------------------------------------

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/
const processUnique = randomBytes(5).toString('hex')
let objectIdCounter = randomInt(0xffffff)

function generateObjectId(): string {
  const time = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0')
  objectIdCounter = (objectIdCounter + 1) % 0xffffff
  return time + processUnique + objectIdCounter.toString(16).padStart(6, '0')
}

// Document ids are 24-char hex strings (MongoDB ObjectId format, kept from the migrated data)
export function isValidId(value: unknown): boolean {
  return value instanceof ObjectId || (typeof value === 'string' && OBJECT_ID_PATTERN.test(value))
}

export function newId(): string {
  return generateObjectId()
}

class ObjectId {
  private readonly hex: string

  constructor(id?: string | ObjectId | { _id: any } | null) {
    if (id === undefined || id === null) {
      this.hex = generateObjectId()
      return
    }
    const value = typeof id === 'object' && !(id instanceof ObjectId) ? (id as any)._id : id
    const hex = value instanceof ObjectId ? value.toHexString() : String(value)
    if (!OBJECT_ID_PATTERN.test(hex)) throw new CastError('ObjectId', value, '')
    this.hex = hex.toLowerCase()
  }

  static isValid(value: unknown): boolean {
    return isValidId(value)
  }

  toHexString() {
    return this.hex
  }

  toString() {
    return this.hex
  }

  toJSON() {
    return this.hex
  }

  equals(other: unknown) {
    return other != null && String(other) === this.hex
  }
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class CastError extends Error {
  constructor(public kind: string, public value: unknown, public path: string) {
    super(`Cast to ${kind} failed for value "${String(value)}" at path "${path}"`)
    this.name = 'CastError'
  }
}

class ValidatorError extends Error {
  constructor(public path: string, message: string, public kind: string) {
    super(message)
    this.name = 'ValidatorError'
  }
}

export class ValidationError extends Error {
  constructor(public errors: Record<string, ValidatorError | CastError>) {
    super(`Validation failed: ${Object.values(errors).map((e) => `${(e as any).path}: ${e.message}`).join(', ')}`)
    this.name = 'ValidationError'
  }
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const Mixed = Symbol('Mixed')

type ScalarKind = 'string' | 'number' | 'boolean' | 'date' | 'objectId' | 'mixed'
type FieldSpec =
  | {
      kind: ScalarKind
      ref?: string
      required?: boolean
      default?: unknown
      enum?: unknown[]
      min?: number
      max?: number
      trim?: boolean
    }
  | { kind: 'array'; of: FieldSpec; default?: unknown }
  | { kind: 'object'; fields: Record<string, FieldSpec> }

function scalarKind(type: unknown): ScalarKind | null {
  if (type === String) return 'string'
  if (type === Number) return 'number'
  if (type === Boolean) return 'boolean'
  if (type === Date) return 'date'
  if (type === ObjectId) return 'objectId'
  if (type === Mixed || type === Object) return 'mixed'
  return null
}

function isPlainObject(value: unknown): value is Record<string, any> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function parseField(def: any): FieldSpec {
  if (Array.isArray(def)) return { kind: 'array', of: def.length ? parseField(def[0]) : { kind: 'mixed' } }

  const kind = scalarKind(def)
  if (kind) return { kind }

  if (isPlainObject(def)) {
    const { type, ...options } = def
    if (Array.isArray(type)) return { ...parseField(type), default: options.default } as FieldSpec
    const typeKind = type !== undefined && !isPlainObject(type) ? scalarKind(type) : null
    if (typeKind) return { kind: typeKind, ...options }
    // Nested object (a field literally named "type" is handled by recursing into it)
    const fields: Record<string, FieldSpec> = {}
    for (const [key, child] of Object.entries(def)) fields[key] = parseField(child)
    return { kind: 'object', fields }
  }

  return { kind: 'mixed' }
}

export class Schema<T = any> {
  static Types = { ObjectId, Mixed, String, Number, Boolean, Date }

  readonly fields: Record<string, FieldSpec>

  constructor(definition: Record<string, any>, public options: { timestamps?: boolean; collection?: string } = {}) {
    this.fields = {}
    for (const [key, def] of Object.entries(definition)) this.fields[key] = parseField(def)
    if (options.timestamps) {
      this.fields.createdAt = { kind: 'date' }
      this.fields.updatedAt = { kind: 'date' }
    }
  }

  // Indexes are a MongoDB concept; kept so model files stay unchanged
  index(_fields: Record<string, any>, _options?: Record<string, any>) {
    return this
  }

  specAt(path: string): FieldSpec | undefined {
    let spec: FieldSpec | undefined = { kind: 'object', fields: this.fields }
    for (const segment of path.split('.')) {
      while (spec?.kind === 'array') spec = spec.of
      if (spec?.kind !== 'object') return undefined
      spec = spec.fields[segment]
    }
    return spec
  }
}

// ---------------------------------------------------------------------------
// Casting, defaults and validation
// ---------------------------------------------------------------------------

type Errors = Record<string, CastError | ValidatorError>

function castValue(spec: FieldSpec, value: any, path: string, errors: Errors): any {
  if (value === undefined || value === null) return value

  switch (spec.kind) {
    case 'string': {
      if (typeof value === 'object' && !(value instanceof ObjectId)) {
        errors[path] = new CastError('string', value, path)
        return undefined
      }
      const str = String(value)
      return spec.trim ? str.trim() : str
    }
    case 'number': {
      const num = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
      if (Number.isNaN(num)) {
        errors[path] = new CastError('Number', value, path)
        return undefined
      }
      return num
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value
      if (['true', '1', 'yes', 1].includes(value)) return true
      if (['false', '0', 'no', 0].includes(value)) return false
      errors[path] = new CastError('Boolean', value, path)
      return undefined
    }
    case 'date': {
      const date = value instanceof Timestamp ? value.toDate() : value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) {
        errors[path] = new CastError('date', value, path)
        return undefined
      }
      return date
    }
    case 'objectId': {
      const raw = value instanceof ObjectId ? value.toHexString() : typeof value === 'object' ? value._id : value
      const id = raw instanceof ObjectId ? raw.toHexString() : raw
      if (typeof id !== 'string' || !OBJECT_ID_PATTERN.test(id)) {
        errors[path] = new CastError('ObjectId', value, path)
        return undefined
      }
      return id.toLowerCase()
    }
    case 'mixed':
      return normalize(value)
    case 'array': {
      const items = Array.isArray(value) ? value : [value]
      return items
        .map((item, i) => castValue(spec.of, item, `${path}.${i}`, errors))
        .filter((item) => item !== undefined)
    }
    case 'object': {
      if (typeof value !== 'object') {
        errors[path] = new CastError('Embedded', value, path)
        return undefined
      }
      // Subdocuments get their defaults whenever they are cast, like Mongoose subdocs
      const result = castObject(spec.fields, value, path, errors)
      applyDefaults(spec.fields, result)
      return result
    }
  }
}

function castObject(fields: Record<string, FieldSpec>, value: Record<string, any>, basePath: string, errors: Errors) {
  const result: Record<string, any> = {}
  // Strict mode: keys that are not in the schema are dropped, like Mongoose does
  for (const [key, spec] of Object.entries(fields)) {
    const cast = castValue(spec, value[key], basePath ? `${basePath}.${key}` : key, errors)
    if (cast !== undefined) result[key] = cast
  }
  return result
}

function defaultFor(spec: FieldSpec): unknown {
  if ('default' in spec && spec.default !== undefined) {
    return typeof spec.default === 'function' ? (spec.default as () => unknown)() : spec.default
  }
  if (spec.kind === 'array') return []
  return undefined
}

function applyDefaults(fields: Record<string, FieldSpec>, target: Record<string, any>) {
  for (const [key, spec] of Object.entries(fields)) {
    if (target[key] !== undefined) continue
    const value = castValue(spec, defaultFor(spec), key, {})
    if (value !== undefined) target[key] = value
  }
}

function validateValue(spec: FieldSpec, value: any, path: string, errors: Errors) {
  if (spec.kind === 'array') {
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item !== null && item !== undefined) validateValue(spec.of, item, `${path}.${i}`, errors)
      })
    }
    return
  }
  if (spec.kind === 'object') {
    if (value && typeof value === 'object') validateFields(spec.fields, value, path, errors)
    return
  }
  if (spec.required && (value === undefined || value === null || value === '')) {
    errors[path] = new ValidatorError(path, `Path \`${path}\` is required.`, 'required')
    return
  }
  if (value === undefined || value === null) return
  if (spec.enum && !spec.enum.includes(value)) {
    errors[path] = new ValidatorError(path, `\`${value}\` is not a valid enum value for path \`${path}\`.`, 'enum')
  }
  const comparable = value instanceof Date ? value.getTime() : value
  if (spec.min !== undefined && typeof comparable === 'number' && comparable < spec.min) {
    errors[path] = new ValidatorError(path, `Path \`${path}\` (${value}) is less than minimum allowed value (${spec.min}).`, 'min')
  }
  if (spec.max !== undefined && typeof comparable === 'number' && comparable > spec.max) {
    errors[path] = new ValidatorError(path, `Path \`${path}\` (${value}) is more than maximum allowed value (${spec.max}).`, 'max')
  }
}

function validateFields(fields: Record<string, FieldSpec>, value: Record<string, any>, basePath: string, errors: Errors, only?: Set<string>) {
  for (const [key, spec] of Object.entries(fields)) {
    if (only && !only.has(key)) continue
    validateValue(spec, value[key], basePath ? `${basePath}.${key}` : key, errors)
  }
}

// ---------------------------------------------------------------------------
// Value helpers
// ---------------------------------------------------------------------------

// Converts ObjectIds/documents to plain storable values
function normalize(value: any): any {
  if (value === undefined || value === null) return value
  if (value instanceof ObjectId) return value.toHexString()
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date || value instanceof RegExp || Buffer.isBuffer(value)) return value
  if (value instanceof ModelDocument) return value.toObject()
  if (Array.isArray(value)) return value.map(normalize)
  if (typeof value === 'object') {
    const result: Record<string, any> = {}
    for (const [key, child] of Object.entries(value)) {
      if (child !== undefined) result[key] = normalize(child)
    }
    return result
  }
  return value
}

function fromFirestore(value: any): any {
  if (value instanceof Timestamp) return value.toDate()
  if (Array.isArray(value)) return value.map(fromFirestore)
  if (isPlainObject(value)) {
    const result: Record<string, any> = {}
    for (const [key, child] of Object.entries(value)) result[key] = fromFirestore(child)
    return result
  }
  return value
}

function snapshotToRaw(snapshot: DocumentSnapshot): Record<string, any> | null {
  if (!snapshot.exists) return null
  return { _id: snapshot.id, ...fromFirestore(snapshot.data()) }
}

function comparable(value: any): any {
  if (value instanceof Date) return value.getTime()
  if (value instanceof ObjectId) return value.toHexString()
  if (value instanceof ModelDocument) return value._id
  return value
}

function deepEqual(a: any, b: any): boolean {
  a = comparable(a)
  b = comparable(b)
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Buffer.isBuffer(a) || Buffer.isBuffer(b)) return Buffer.isBuffer(a) && Buffer.isBuffer(b) && a.equals(b)
  const keysA = Object.keys(a).filter((k) => a[k] !== undefined)
  const keysB = Object.keys(b).filter((k) => b[k] !== undefined)
  return keysA.length === keysB.length && keysA.every((key) => deepEqual(a[key], b[key]))
}

function clone<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as T
  if (Array.isArray(value)) return value.map(clone) as T
  if (isPlainObject(value)) {
    const result: Record<string, any> = {}
    for (const [key, child] of Object.entries(value)) result[key] = clone(child)
    return result as T
  }
  return value
}

// All values reachable at a dotted path, flattening through arrays like MongoDB does
function valuesAtPath(obj: any, path: string): any[] {
  const segments = path.split('.')
  let current: any[] = [obj]
  for (const segment of segments) {
    const next: any[] = []
    for (const item of current) {
      if (item === null || item === undefined) continue
      if (Array.isArray(item) && !/^\d+$/.test(segment)) {
        for (const element of item) if (element !== null && typeof element === 'object') next.push(element[segment])
      } else {
        next.push(item[segment])
      }
    }
    current = next
  }
  return current
}

function setAtPath(obj: Record<string, any>, path: string, value: any) {
  const segments = path.split('.')
  let target = obj
  for (const segment of segments.slice(0, -1)) {
    if (target[segment] === null || typeof target[segment] !== 'object') target[segment] = {}
    target = target[segment]
  }
  target[segments[segments.length - 1]] = value
}

function unsetAtPath(obj: Record<string, any>, path: string) {
  const segments = path.split('.')
  let target = obj
  for (const segment of segments.slice(0, -1)) {
    target = target?.[segment]
    if (target === null || typeof target !== 'object') return
  }
  delete target[segments[segments.length - 1]]
}

// ---------------------------------------------------------------------------
// Filter matching (MongoDB query semantics, in memory)
// ---------------------------------------------------------------------------

function equalsCondition(value: any, target: any): boolean {
  if (target instanceof RegExp) return typeof value === 'string' && target.test(value)
  if (target === null) return value === null || value === undefined
  if (Array.isArray(value)) {
    return value.some((item) => deepEqual(item, target)) || deepEqual(value, target)
  }
  return deepEqual(value, target)
}

function compare(value: any, target: any, op: string): boolean {
  const a = comparable(value)
  const b = comparable(target)
  if (a === null || a === undefined || b === null || b === undefined) return false
  if (typeof a !== typeof b) return false
  switch (op) {
    case '$gt':
      return a > b
    case '$gte':
      return a >= b
    case '$lt':
      return a < b
    case '$lte':
      return a <= b
  }
  return false
}

function matchesOperator(values: any[], op: string, arg: any, condition: Record<string, any>): boolean {
  const candidates = values.length ? values : [undefined]
  const expanded = candidates.flatMap((v) => (Array.isArray(v) ? [v, ...v] : [v]))
  switch (op) {
    case '$eq':
      return candidates.some((v) => equalsCondition(v, arg))
    case '$ne':
      return !candidates.some((v) => equalsCondition(v, arg))
    case '$in':
      return (arg as any[]).some((target) => candidates.some((v) => equalsCondition(v, target)))
    case '$nin':
      return !(arg as any[]).some((target) => candidates.some((v) => equalsCondition(v, target)))
    case '$gt':
    case '$gte':
    case '$lt':
    case '$lte':
      return expanded.some((v) => compare(v, arg, op))
    case '$exists':
      return candidates.some((v) => v !== undefined) === Boolean(arg)
    case '$regex': {
      const regex = arg instanceof RegExp ? arg : new RegExp(arg, condition.$options || '')
      return expanded.some((v) => typeof v === 'string' && regex.test(v))
    }
    case '$options':
      return true
    case '$size':
      return candidates.some((v) => Array.isArray(v) && v.length === arg)
    case '$elemMatch':
      return candidates.some((v) => Array.isArray(v) && v.some((item) => matchesFilter(item, arg)))
    case '$not':
      return !matchesCondition(values, arg)
  }
  throw new Error(`Unsupported query operator ${op}`)
}

function isOperatorObject(value: any): value is Record<string, any> {
  return isPlainObject(value) && Object.keys(value).length > 0 && Object.keys(value).every((k) => k.startsWith('$'))
}

function matchesCondition(values: any[], condition: any): boolean {
  if (isOperatorObject(condition)) {
    return Object.entries(condition).every(([op, arg]) => matchesOperator(values, op, arg, condition))
  }
  const candidates = values.length ? values : [undefined]
  return candidates.some((v) => equalsCondition(v, condition))
}

export function matchesFilter(doc: any, filter: Record<string, any>): boolean {
  for (const [key, condition] of Object.entries(filter)) {
    if (condition === undefined) continue // the MongoDB driver drops undefined keys
    if (key === '$or') {
      if (!(condition as any[]).some((sub) => matchesFilter(doc, sub))) return false
    } else if (key === '$and') {
      if (!(condition as any[]).every((sub) => matchesFilter(doc, sub))) return false
    } else if (key === '$nor') {
      if ((condition as any[]).some((sub) => matchesFilter(doc, sub))) return false
    } else if (!matchesCondition(valuesAtPath(doc, key), condition)) {
      return false
    }
  }
  return true
}

type SortSpec = Array<[string, 1 | -1]>

function parseSort(sort: any): SortSpec {
  if (typeof sort === 'string') {
    return sort
      .split(/\s+/)
      .filter(Boolean)
      .map((field) => (field.startsWith('-') ? [field.slice(1), -1] : [field, 1]))
  }
  return Object.entries(sort || {}).map(([field, dir]) => [
    field,
    dir === -1 || dir === 'desc' || dir === 'descending' ? -1 : 1,
  ])
}

function compareForSort(a: any, b: any): number {
  a = comparable(a)
  b = comparable(b)
  const aMissing = a === null || a === undefined
  const bMissing = b === null || b === undefined
  if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? -1 : 1
  if (typeof a !== typeof b) return String(typeof a).localeCompare(typeof b)
  return a < b ? -1 : a > b ? 1 : 0
}

function sortDocs(docs: any[], sort: SortSpec) {
  return docs.sort((x, y) => {
    for (const [field, dir] of sort) {
      const result = compareForSort(valuesAtPath(x, field)[0], valuesAtPath(y, field)[0])
      if (result !== 0) return result * dir
    }
    return 0
  })
}

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------

type Projection = { mode: 'include' | 'exclude'; fields: Set<string> } | null

function parseProjection(select: any): Projection {
  if (!select) return null
  let entries: Array<[string, boolean]>
  if (typeof select === 'string') {
    entries = select
      .split(/\s+/)
      .filter(Boolean)
      .map((f) => (f.startsWith('-') ? [f.slice(1), false] : [f.replace(/^\+/, ''), true]))
  } else {
    entries = Object.entries(select).map(([f, v]) => [f, Boolean(v)])
  }
  const nonId = entries.filter(([f]) => f !== '_id')
  const include = nonId.length ? nonId[0][1] : entries.every(([, v]) => v)
  const fields = new Set(entries.filter(([, v]) => v === include).map(([f]) => f.split('.')[0]))
  return { mode: include ? 'include' : 'exclude', fields }
}

function applyProjection(raw: Record<string, any>, projection: Projection) {
  if (!projection) return raw
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(raw)) {
    const listed = projection.fields.has(key)
    if (key === '_id' || (projection.mode === 'include' ? listed : !listed)) result[key] = value
  }
  return result
}

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

function applyUpdate(target: Record<string, any>, update: Record<string, any>): Set<string> {
  const touched = new Set<string>()
  const setFields: Record<string, any> = {}
  for (const [key, value] of Object.entries(update)) {
    if (!key.startsWith('$')) setFields[key] = value
  }
  const ops: Record<string, any> = { ...update, $set: { ...(update.$set || {}), ...setFields } }

  for (const [op, fields] of Object.entries(ops)) {
    if (!op.startsWith('$') || !fields) continue
    for (const [path, value] of Object.entries(fields as Record<string, any>)) {
      if (value === undefined && op === '$set') continue // Mongoose strips undefined update values
      touched.add(path.split('.')[0])
      const current = valuesAtPath(target, path)[0]
      switch (op) {
        case '$set':
          setAtPath(target, path, normalize(value))
          break
        case '$setOnInsert':
          break
        case '$unset':
          unsetAtPath(target, path)
          break
        case '$inc':
          setAtPath(target, path, (Number(current) || 0) + Number(value))
          break
        case '$push': {
          const items = isPlainObject(value) && '$each' in value ? value.$each : [value]
          setAtPath(target, path, [...(Array.isArray(current) ? current : []), ...items.map(normalize)])
          break
        }
        case '$addToSet': {
          const items = isPlainObject(value) && '$each' in value ? value.$each : [value]
          const list = [...(Array.isArray(current) ? current : [])]
          for (const item of items.map(normalize)) if (!list.some((existing) => deepEqual(existing, item))) list.push(item)
          setAtPath(target, path, list)
          break
        }
        case '$pull': {
          const list = Array.isArray(current) ? current : []
          setAtPath(
            target,
            path,
            list.filter((item) => (isPlainObject(value) && !isOperatorObject(value) ? !matchesFilter(item, value) : !matchesCondition([item], normalize(value))))
          )
          break
        }
        default:
          throw new Error(`Unsupported update operator ${op}`)
      }
    }
  }
  return touched
}

// Top-level field diff written with update(); removed fields are deleted
// Fields outside the schema are left untouched, like Mongoose leaves unknown stored fields alone
async function writeDiff(ref: DocumentReference, schema: Schema, before: Record<string, any>, after: Record<string, any>) {
  const changes: Record<string, any> = {}
  const keys = new Set([...Object.keys(schema.fields), ...Object.keys(after)])
  keys.delete('_id')
  for (const key of keys) {
    if (after[key] === undefined) {
      if (before[key] !== undefined && key in schema.fields) changes[key] = FieldValue.delete()
    } else if (!deepEqual(before[key], after[key])) {
      changes[key] = after[key]
    }
  }
  if (Object.keys(changes).length) await ref.update(changes)
}

function withoutId(raw: Record<string, any>) {
  const { _id, ...rest } = raw
  return rest
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

const MODEL = Symbol('model')
const IS_NEW = Symbol('isNew')
const SNAPSHOT = Symbol('snapshot')

export class ModelDocument {
  _id!: string;
  [key: string]: any

  constructor(model: ModelClass, data: Record<string, any>, isNew: boolean, applyDefaultValues = true) {
    Object.defineProperty(this, MODEL, { value: model, enumerable: false, writable: true })
    Object.defineProperty(this, IS_NEW, { value: isNew, enumerable: false, writable: true })
    Object.defineProperty(this, SNAPSHOT, { value: isNew ? {} : clone(data), enumerable: false, writable: true })

    if (isNew) {
      const errors: Errors = {}
      const cast = castObject(model.schema.fields, normalize(data) || {}, '', errors)
      // Keep invalid raw values so save() reports them as validation errors
      for (const path of Object.keys(errors)) if (!path.includes('.')) cast[path] = data[path]
      Object.assign(this, cast)
      this._id = data._id ? String(data._id instanceof ObjectId ? data._id.toHexString() : data._id) : generateObjectId()
    } else {
      Object.assign(this, data)
    }
    if (applyDefaultValues) applyDefaults(model.schema.fields, this)
  }

  get id(): string {
    return this._id
  }

  set id(value: any) {
    Object.defineProperty(this, 'id', { value, enumerable: true, writable: true, configurable: true })
  }

  get isNew(): boolean {
    return (this as any)[IS_NEW]
  }

  set isNew(value: boolean) {
    ;(this as any)[IS_NEW] = value
  }

  toObject(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(this)) {
      if (value !== undefined) result[key] = toPlain(value)
    }
    return result
  }

  toJSON() {
    return this.toObject()
  }

  async save(): Promise<this> {
    const model: ModelClass = (this as any)[MODEL]
    const errors: Errors = {}
    const data = castObject(model.schema.fields, this, '', errors)
    validateFields(model.schema.fields, data, '', errors)
    if (Object.keys(errors).length) throw new ValidationError(errors)

    const now = new Date()
    if (model.schema.options.timestamps) {
      if (this.isNew && !data.createdAt) data.createdAt = now
      data.updatedAt = now
    }

    const ref = model.collection().doc(this._id)
    if (this.isNew) {
      await ref.create(data)
      ;(this as any)[IS_NEW] = false
    } else {
      await writeDiff(ref, model.schema, (this as any)[SNAPSHOT], data)
    }
    ;(this as any)[SNAPSHOT] = clone({ _id: this._id, ...data })

    // Keep populated references populated in memory, as Mongoose does
    for (const [key, value] of Object.entries(data)) {
      if (!isPopulated(this[key])) this[key] = value
    }
    return this
  }

  async populate(path: string | PopulateOptions | Array<string | PopulateOptions>, select?: string): Promise<this> {
    const model: ModelClass = (this as any)[MODEL]
    await populateDocs(model, [this], normalizePopulate(path, select), false)
    return this
  }

  async deleteOne() {
    const model: ModelClass = (this as any)[MODEL]
    await model.collection().doc(this._id).delete()
    return this
  }
}

function isPopulated(value: any): boolean {
  if (value instanceof ModelDocument) return true
  if (Array.isArray(value)) return value.some((item) => item instanceof ModelDocument || isPopulated(item))
  if (isPlainObject(value)) return Object.values(value).some(isPopulated)
  return false
}

function toPlain(value: any): any {
  if (value instanceof ModelDocument) return value.toObject()
  if (Array.isArray(value)) return value.map(toPlain)
  if (isPlainObject(value)) {
    const result: Record<string, any> = {}
    for (const [key, child] of Object.entries(value)) if (child !== undefined) result[key] = toPlain(child)
    return result
  }
  return value
}

// ---------------------------------------------------------------------------
// Populate
// ---------------------------------------------------------------------------

type PopulateOptions = { path: string; select?: any; model?: string | ModelClass; populate?: any }

function normalizePopulate(path: any, select?: any): PopulateOptions[] {
  if (Array.isArray(path)) return path.flatMap((p) => normalizePopulate(p, select))
  if (typeof path === 'string') return path.split(/\s+/).filter(Boolean).map((p) => ({ path: p, select }))
  return [path]
}

function refId(value: any): string | null {
  if (value === null || value === undefined) return null
  if (value instanceof ObjectId) return value.toHexString()
  const id = typeof value === 'object' ? (value._id ? String(value._id) : null) : String(value)
  return id && id !== '' && !id.includes('/') ? id : null
}

function replaceAtPath(obj: any, segments: string[], replace: (value: any) => any) {
  if (obj === null || typeof obj !== 'object') return
  if (Array.isArray(obj)) {
    obj.forEach((item) => replaceAtPath(item, segments, replace))
    return
  }
  const [head, ...rest] = segments
  if (!(head in obj)) return
  if (rest.length === 0) {
    const value = obj[head]
    obj[head] = Array.isArray(value)
      ? value.map(replace).filter((item: any) => item !== null && item !== undefined)
      : replace(value)
  } else {
    replaceAtPath(obj[head], rest, replace)
  }
}

async function fetchByIds(model: ModelClass, ids: string[]): Promise<Map<string, Record<string, any>>> {
  const result = new Map<string, Record<string, any>>()
  const refs = ids.map((id) => model.collection().doc(id))
  const batches: DocumentReference[][] = []
  for (let i = 0; i < refs.length; i += 100) batches.push(refs.slice(i, i + 100))
  // Batches run in parallel: each getAll is a network round trip
  const snapshots = await Promise.all(batches.map((batch) => getDb().getAll(...batch)))
  for (const snapshot of snapshots.flat()) {
    const raw = snapshotToRaw(snapshot)
    if (raw) result.set(raw._id, raw)
  }
  return result
}

async function populateDocs(model: ModelClass, docs: any[], specs: PopulateOptions[], lean: boolean) {
  // Independent paths are fetched in parallel; nested paths (a, a.b) must run in order
  const nested = specs.some((a) => specs.some((b) => a !== b && b.path.startsWith(`${a.path}.`)))
  if (nested) {
    for (const spec of specs) await populateOne(model, docs, spec, lean)
  } else {
    await Promise.all(specs.map((spec) => populateOne(model, docs, spec, lean)))
  }
}

async function populateOne(model: ModelClass, docs: any[], spec: PopulateOptions, lean: boolean) {
  {
    const fieldSpec = model.schema.specAt(spec.path)
    const refName =
      typeof spec.model === 'string'
        ? spec.model
        : spec.model?.modelName ?? (fieldSpec?.kind === 'array' ? (fieldSpec.of as any).ref : (fieldSpec as any)?.ref)
    const target = refName ? models[refName] : undefined
    if (!target) return // strictPopulate: false - unknown paths are ignored

    const ids = new Set<string>()
    for (const doc of docs) {
      for (const value of valuesAtPath(doc, spec.path)) {
        for (const item of Array.isArray(value) ? value : [value]) {
          const id = refId(item)
          if (id) ids.add(id)
        }
      }
    }
    if (!ids.size) return

    const found = await fetchByIds(target, [...ids])
    const projection = parseProjection(spec.select)
    const hydrated = new Map<string, any>()
    for (const [id, raw] of found) {
      const projected = applyProjection(raw, projection)
      hydrated.set(id, lean ? projected : new target(projected, { isNew: false, defaults: !projection }))
    }
    if (spec.populate) await populateDocs(target, [...hydrated.values()], normalizePopulate(spec.populate), lean)

    const segments = spec.path.split('.')
    for (const doc of docs) {
      replaceAtPath(doc, segments, (value) => {
        const id = refId(value)
        return id ? hydrated.get(id) ?? null : value
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

type QueryOp = 'find' | 'findOne' | 'count' | 'findOneAndUpdate' | 'findOneAndDelete' | 'updateMany' | 'deleteMany'

class Query<T = any> implements PromiseLike<T> {
  private populates: PopulateOptions[] = []
  private sortSpec: SortSpec = []
  private projection: Projection = null
  private isLean = false
  private skipCount = 0
  private limitCount = 0

  constructor(
    private model: ModelClass,
    private op: QueryOp,
    private filter: Record<string, any>,
    private update?: Record<string, any>,
    private options: Record<string, any> = {}
  ) {}

  populate(path: string | PopulateOptions | Array<string | PopulateOptions>, select?: any) {
    this.populates.push(...normalizePopulate(path, select))
    return this
  }

  sort(sort: any) {
    this.sortSpec = parseSort(sort)
    return this
  }

  select(select: any) {
    this.projection = parseProjection(select)
    return this
  }

  lean() {
    this.isLean = true
    return this
  }

  skip(count: number) {
    this.skipCount = count
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  exec(): Promise<T> {
    return this.run() as Promise<T>
  }

  then<R1 = T, R2 = never>(
    onfulfilled?: ((value: T) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return this.exec().then(onfulfilled, onrejected)
  }

  catch<R = never>(onrejected?: ((reason: any) => R | PromiseLike<R>) | null) {
    return this.exec().catch(onrejected)
  }

  // With an inclusive select() on a read-only query, fetch only the selected fields plus those
  // the filter and sort need. Writes (update/delete) always need whole documents.
  private fieldsToFetch(): string[] | undefined {
    if (!this.projection || this.projection.mode !== 'include') return undefined
    if (this.op !== 'find' && this.op !== 'findOne' && this.op !== 'count') return undefined
    const fields = new Set<string>(this.projection.fields)
    const collect = (filter: Record<string, any>) => {
      for (const [key, value] of Object.entries(filter)) {
        if (key === '$or' || key === '$and' || key === '$nor') (value as any[]).forEach(collect)
        else if (!key.startsWith('$')) fields.add(key.split('.')[0])
      }
    }
    collect(this.filter)
    for (const [field] of this.sortSpec) fields.add(field.split('.')[0])
    fields.delete('_id')
    return [...fields]
  }

  private hydrate(raw: Record<string, any>) {
    const projected = applyProjection(raw, this.projection)
    return this.isLean ? projected : new this.model(projected, { isNew: false, defaults: !this.projection })
  }

  private async finish(raws: Record<string, any>[]) {
    const docs = raws.map((raw) => this.hydrate(raw))
    if (this.populates.length) await populateDocs(this.model, docs, this.populates, this.isLean)
    return docs
  }

  private async run(): Promise<any> {
    const model = this.model
    let matched = (await model.fetchCandidates(this.filter, this.fieldsToFetch())).filter((doc) =>
      matchesFilter(doc, this.filter)
    )
    if (this.sortSpec.length) sortDocs(matched, this.sortSpec)
    if (this.skipCount) matched = matched.slice(this.skipCount)
    if (this.limitCount) matched = matched.slice(0, this.limitCount)

    switch (this.op) {
      case 'count':
        return matched.length
      case 'find':
        return this.finish(matched)
      case 'findOne': {
        const [doc] = await this.finish(matched.slice(0, 1))
        return doc ?? null
      }
      case 'findOneAndDelete': {
        const raw = matched[0]
        if (!raw) return null
        await model.collection().doc(raw._id).delete()
        return (await this.finish([raw]))[0]
      }
      case 'deleteMany': {
        await Promise.all(matched.map((raw) => model.collection().doc(raw._id).delete()))
        return { acknowledged: true, deletedCount: matched.length }
      }
      case 'updateMany': {
        let modifiedCount = 0
        for (const raw of matched) {
          const updated = model.updatedRaw(raw, this.update!, this.options, false)
          const before = model.castStored(raw)
          if (!deepEqual(withoutId(before), withoutId(updated))) modifiedCount++
          await writeDiff(model.collection().doc(raw._id), model.schema, raw, updated)
        }
        return { acknowledged: true, matchedCount: matched.length, modifiedCount }
      }
      case 'findOneAndUpdate': {
        const existing = matched[0]
        if (!existing) {
          if (!this.options.upsert) return null
          const seed: Record<string, any> = {}
          for (const [key, value] of Object.entries(this.filter)) {
            if (!key.startsWith('$') && !isOperatorObject(value) && !(value instanceof RegExp)) setAtPath(seed, key, normalize(value))
          }
          const created = model.updatedRaw({ _id: seed._id ?? generateObjectId(), ...seed }, this.update!, this.options, true)
          await model.collection().doc(created._id).create(withoutId(created))
          return this.options.new ? (await this.finish([created]))[0] : null
        }
        const updated = model.updatedRaw(existing, this.update!, this.options, false)
        await writeDiff(model.collection().doc(existing._id), model.schema, existing, updated)
        return (await this.finish([this.options.new ? updated : existing]))[0]
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export interface ModelClass {
  new (data?: Record<string, any>, options?: { isNew?: boolean; defaults?: boolean }): ModelDocument & Record<string, any>
  modelName: string
  schema: Schema
  collectionName: string
  collection(): FirebaseFirestore.CollectionReference
  fetchCandidates(filter: Record<string, any>, fields?: string[]): Promise<Record<string, any>[]>
  castStored(raw: Record<string, any>): Record<string, any>
  updatedRaw(raw: Record<string, any>, update: Record<string, any>, options: Record<string, any>, isInsert: boolean): Record<string, any>
  find(filter?: Record<string, any>, projection?: any): Query<any[]>
  findOne(filter?: Record<string, any>, projection?: any): Query<any>
  findById(id: any, projection?: any): Query<any>
  findByIdAndUpdate(id: any, update: Record<string, any>, options?: Record<string, any>): Query<any>
  findOneAndUpdate(filter: Record<string, any>, update: Record<string, any>, options?: Record<string, any>): Query<any>
  findByIdAndDelete(id: any): Query<any>
  findOneAndDelete(filter: Record<string, any>): Query<any>
  updateMany(filter: Record<string, any>, update: Record<string, any>, options?: Record<string, any>): Query<any>
  updateOne(filter: Record<string, any>, update: Record<string, any>, options?: Record<string, any>): Query<any>
  deleteMany(filter?: Record<string, any>): Query<any>
  deleteOne(filter?: Record<string, any>): Query<any>
  countDocuments(filter?: Record<string, any>): Query<number>
  create(data: any): Promise<any>
  exists(filter: Record<string, any>): Promise<{ _id: string } | null>
}

export type Model<T = any> = ModelClass

function idCondition(id: any): string | null {
  if (id === null || id === undefined) return null
  const hex = id instanceof ObjectId ? id.toHexString() : typeof id === 'object' && id._id ? String(id._id) : id
  if (typeof hex !== 'string' || !OBJECT_ID_PATTERN.test(hex)) throw new CastError('ObjectId', id, '_id')
  return hex.toLowerCase()
}

// Only plain scalar equality on non-array fields is sent to Firestore
function pushdownFilters(schema: Schema, filter: Record<string, any>): Array<[string, unknown]> {
  const conditions: Array<[string, unknown]> = []
  for (const [key, raw] of Object.entries(filter)) {
    if (key.startsWith('$') || key.includes('.') || key === '_id') continue
    const spec = schema.fields[key]
    if (!spec || spec.kind === 'array' || spec.kind === 'mixed' || spec.kind === 'object') continue
    const value = raw instanceof ObjectId ? raw.toHexString() : raw
    if (['string', 'number', 'boolean'].includes(typeof value)) conditions.push([key, value])
  }
  return conditions
}

export const models: Record<string, ModelClass> = {}

export function model<T = any>(name: string, schema: Schema<T>): ModelClass {
  const collectionName = schema.options.collection || `${name.toLowerCase()}s`

  const Model = class extends ModelDocument {
    static modelName = name
    static schema = schema
    static collectionName = collectionName

    constructor(data: Record<string, any> = {}, options: { isNew?: boolean; defaults?: boolean } = {}) {
      super(Model as unknown as ModelClass, data, options.isNew ?? true, options.defaults ?? true)
    }

    static collection() {
      return getDb().collection(collectionName)
    }

    static async fetchCandidates(filter: Record<string, any>, fields?: string[]): Promise<Record<string, any>[]> {
      const idFilter = filter._id
      if (idFilter !== undefined && !isOperatorObject(idFilter)) {
        const id = idCondition(idFilter)
        if (!id) return []
        const raw = snapshotToRaw(await this.collection().doc(id).get())
        return raw ? [raw] : []
      }
      if (isOperatorObject(idFilter) && Array.isArray(idFilter.$in)) {
        const ids = idFilter.$in.map(idCondition).filter(Boolean) as string[]
        return [...(await fetchByIds(this as unknown as ModelClass, [...new Set(ids)])).values()]
      }

      let query: FirebaseFirestore.Query = this.collection()
      for (const [field, value] of pushdownFilters(schema, filter)) query = query.where(field, '==', value)
      // Field mask: only transfer the fields the query needs
      if (fields) query = query.select(...fields)
      const snapshot = await query.get()
      return snapshot.docs.map((doc) => snapshotToRaw(doc)!)
    }

    // Stored document cast to schema types (drops unknown fields)
    static castStored(raw: Record<string, any>) {
      const data = castObject(schema.fields, raw, '', {})
      return { _id: raw._id, ...data }
    }

    static updatedRaw(raw: Record<string, any>, update: Record<string, any>, options: Record<string, any>, isInsert: boolean) {
      const next = clone(raw)
      const touched = applyUpdate(next, update)
      if (isInsert && update.$setOnInsert) {
        for (const [path, value] of Object.entries(update.$setOnInsert)) setAtPath(next, path, normalize(value))
      }

      const errors: Errors = {}
      const data = castObject(schema.fields, next, '', errors)
      const castErrors = Object.values(errors)
      if (castErrors.length) throw castErrors[0]

      if (isInsert) applyDefaults(schema.fields, data)
      if (options.runValidators || isInsert) {
        const validationErrors: Errors = {}
        validateFields(schema.fields, data, '', validationErrors, isInsert ? undefined : touched)
        if (Object.keys(validationErrors).length) throw new ValidationError(validationErrors)
      }
      if (schema.options.timestamps) {
        const now = new Date()
        if (isInsert) data.createdAt = data.createdAt ?? now
        if (!touched.has('updatedAt')) data.updatedAt = now
      }
      return { _id: raw._id, ...data }
    }

    static find(filter: Record<string, any> = {}, projection?: any) {
      const query = new Query<any[]>(this as unknown as ModelClass, 'find', filter)
      return projection ? query.select(projection) : query
    }

    static findOne(filter: Record<string, any> = {}, projection?: any) {
      const query = new Query<any>(this as unknown as ModelClass, 'findOne', filter)
      return projection ? query.select(projection) : query
    }

    static findById(id: any, projection?: any) {
      return this.findOne(id === undefined || id === null ? { _id: null } : { _id: id }, projection)
    }

    static findByIdAndUpdate(id: any, update: Record<string, any>, options: Record<string, any> = {}) {
      return new Query<any>(this as unknown as ModelClass, 'findOneAndUpdate', { _id: id ?? null }, update, options)
    }

    static findOneAndUpdate(filter: Record<string, any>, update: Record<string, any>, options: Record<string, any> = {}) {
      return new Query<any>(this as unknown as ModelClass, 'findOneAndUpdate', filter, update, options)
    }

    static findByIdAndDelete(id: any) {
      return new Query<any>(this as unknown as ModelClass, 'findOneAndDelete', { _id: id ?? null })
    }

    static findOneAndDelete(filter: Record<string, any>) {
      return new Query<any>(this as unknown as ModelClass, 'findOneAndDelete', filter)
    }

    static updateMany(filter: Record<string, any>, update: Record<string, any>, options: Record<string, any> = {}) {
      return new Query<any>(this as unknown as ModelClass, 'updateMany', filter, update, options)
    }

    static updateOne(filter: Record<string, any>, update: Record<string, any>, options: Record<string, any> = {}) {
      return new Query<any>(this as unknown as ModelClass, 'updateMany', filter, update, options).limit(1)
    }

    static deleteMany(filter: Record<string, any> = {}) {
      return new Query<any>(this as unknown as ModelClass, 'deleteMany', filter)
    }

    static deleteOne(filter: Record<string, any> = {}) {
      return new Query<any>(this as unknown as ModelClass, 'deleteMany', filter).limit(1)
    }

    static countDocuments(filter: Record<string, any> = {}) {
      return new Query<number>(this as unknown as ModelClass, 'count', filter)
    }

    static async create(data: any): Promise<any> {
      if (Array.isArray(data)) return Promise.all(data.map((item) => this.create(item)))
      return new Model(data).save()
    }

    static async exists(filter: Record<string, any>) {
      const doc = await this.findOne(filter).select('_id').lean()
      return doc ? { _id: doc._id } : null
    }
  }

  Object.defineProperty(Model, 'name', { value: name })
  const registered = Model as unknown as ModelClass
  models[name] = registered
  return registered
}

export type Document = ModelDocument & { _id: any; createdAt?: Date; updatedAt?: Date }
