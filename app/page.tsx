import { Container } from "@/components/container"
import { Navbar } from "@/components/navbar"
import Hero from "@/components/hero"
import HowItWorks from "@/components/working"
import Features from "@/components/features"
import { Footer } from "@/components/footer"

export default function Home() {

  return (
    <>
      <div className=" border-b-1 border-b-neutral-600">
        <Container >
          <Navbar />
        </Container>
      </div>
      <Hero />
      <HowItWorks />
      <Features />
      <div className=" border-t-1 border-t-neutral-600">
        <Container>
          <Footer />
        </Container>
      </div>
    </>
  )
}
