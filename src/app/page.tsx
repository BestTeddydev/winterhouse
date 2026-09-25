import Navbar from '@/components/Navbar'
import AtvSection from './_home/AtvSection'
import CafeSection from './_home/CafeSection'
import ContactSection from './_home/ContactSection'
import FeaturedRoomsSection from './_home/FeaturedRoomsSection'
import HeroSection from './_home/HeroSection'
import NearbyAttractionsSection from './_home/NearbyAttractionsSection'
import SiteFooter from './_home/SiteFooter'
import StructuredData from './_home/StructuredData'
import WhyChooseUsSection from './_home/WhyChooseUsSection'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <StructuredData />
      <Navbar />
      <HeroSection />
      <FeaturedRoomsSection />
      <CafeSection />
      <AtvSection />
      <NearbyAttractionsSection />
      <WhyChooseUsSection />
      <ContactSection />
      <SiteFooter />
    </div>
  )
}
