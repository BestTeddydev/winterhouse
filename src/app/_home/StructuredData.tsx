

export default function StructuredData() {
  return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            "name": "บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง",
            "alternateName": "บ้านลมหนาว วังน้ำเขียว",
            "description": "คาเฟ่และห้องพักสุดพิเศษที่วังน้ำเขียว พร้อมลานกางเต้นท์ในบรรยากาศธรรมชาติ",
            "url": "https://baanlomnow.com",
            "logo": "https://baanlomnow.com/logo.png",
            "image": "https://baanlomnow.com/background.jpg",
            "telephone": "064-553-5691",
            "email": "banlomnowcafeandcamping@gmail.com",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง",
              "addressLocality": "อำเภอวังน้ำเขียว",
              "addressRegion": "จังหวัดนครราชสีมา",
              "addressCountry": "TH"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "14.5",
              "longitude": "101.8"
            },
            "openingHours": "Mo-Su 07:00-22:00",
            "priceRange": "$$",
            "amenityFeature": [
              {
                "@type": "LocationFeatureSpecification",
                "name": "WiFi",
                "value": true
              },
              {
                "@type": "LocationFeatureSpecification", 
                "name": "Parking",
                "value": true
              },
              {
                "@type": "LocationFeatureSpecification",
                "name": "Restaurant",
                "value": true
              },
              {
                "@type": "LocationFeatureSpecification",
                "name": "Camping",
                "value": true
              }
            ],
            "sameAs": [
              "https://www.facebook.com/banlomnowcafeandcamping",
              "https://www.instagram.com/banlomnowcafeandcamping"
            ],
            "keywords": [
              "บ้านลมหนาว",
              "คาเฟ่ วังน้ำเขียว", 
              "ห้องพัก วังน้ำเขียว",
              "ลานกางเต้นท์วังน้ำเขียว",
              "บ้านลมหนาว วังน้ำเขียว",
              "คาเฟ่ แอนด์ แคมป์ปิ้ง",
              "ที่พักวังน้ำเขียว",
              "กาแฟวังน้ำเขียว",
              "แคมป์ปิ้งวังน้ำเขียว",
              "พักผ่อนวังน้ำเขียว"
            ]
          })
        }}
      />
  )
}
