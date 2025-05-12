import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  return (
    <footer className="border-t border-ui-border-base w-full">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-10">
          <div className="max-w-md">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus text-ui-fg-subtle hover:text-ui-fg-base uppercase"
            >
              Batteries N' Things
            </LocalizedClientLink>
            <p className="mt-4 text-small-regular text-ui-fg-subtle">
              Batteries N' Things provide premium wholesale technology products at the best prices in the country.
            </p>
          </div>

          <div className="max-w-md ml-auto">
            <h4 className="txt-compact-xlarge-plus text-ui-fg-subtle">
              Contact Us
            </h4>
            <p className="mt-4 text-small-regular text-ui-fg-subtle">
              2800 John Street Unit 5, Markham, Ontario, L3R 0E2, Canada
            </p>
            <p className="mt-2 text-small-regular text-ui-fg-subtle">
              Email: info@bntbng.com
            </p>
            <p className="mt-2 text-small-regular text-ui-fg-subtle">
              Phone: 416-368-0023
            </p>
          </div>
        </div>

        <div className="flex w-full mb-16 justify-between text-ui-fg-muted">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} Batteries N' Things. All rights
            reserved.
          </Text>
        </div>
      </div>
    </footer>
  )
}
