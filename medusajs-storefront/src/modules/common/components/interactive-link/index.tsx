import { ArrowUpRightMini, XMark } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "../localized-client-link"

type InteractiveLinkProps = {
  href: string
  children?: React.ReactNode
  onClick?: () => void
  clear?: boolean
}

const InteractiveLink = ({
  href,
  children,
  onClick,
  clear = false,
  ...props
}: InteractiveLinkProps) => {
  return (
    <LocalizedClientLink
      className="flex gap-x-1 items-center group"
      href={href}
      onClick={onClick}
      {...props}
    >
      <Text className="text-ui-fg-interactive">{children}</Text>
      {clear ? (
        <XMark
          className="group-hover:scale-125 group-hover:opacity-80 ease-in-out duration-150"
          color="var(--fg-interactive)"
        />
      ) : (
        <ArrowUpRightMini
          className="group-hover:rotate-45 ease-in-out duration-150"
          color="var(--fg-interactive)"
        />
      )}
    </LocalizedClientLink>
  )
}

export default InteractiveLink
