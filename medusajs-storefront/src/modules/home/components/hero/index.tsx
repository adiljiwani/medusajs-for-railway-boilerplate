import { Github } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="h-[75vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span>
          <Heading
            level="h1"
            className="text-3xl leading-10 text-ui-fg-base font-normal"
          >
            Batteries N' gadgets
          </Heading>
          <Heading
            level="h2"
            className="text-xl leading-10 text-ui-fg-subtle font-normal"
          >
            Carousels will appear here.
          </Heading>
        </span>
        <a
          href="https://github.com/medusajs/nextjs-starter-medusa"
          target="_blank"
        >
          <LocalizedClientLink href={`/store`}>
            <Button variant="secondary">Browse Products</Button>
          </LocalizedClientLink>
        </a>
      </div>
    </div>
  )
}

export default Hero
