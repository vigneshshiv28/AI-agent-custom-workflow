import { Container } from "@/components/container"
import { Navbar } from "@/components/navbar"
import Hero from "@/components/hero"

export default function Home() {

  return (
    <>
      <div className=" border-b-1 border-b-neutral-600">
        <Container >
          <Navbar />
        </Container>
      </div>
      <Hero />
    </>
  )
}
