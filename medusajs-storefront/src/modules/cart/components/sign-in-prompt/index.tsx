import { Heading, Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const SignInPrompt = () => {
  return (
    <div
      className="py-48 px-2 flex flex-col justify-center items-start"
      data-testid="empty-cart-message"
    >
      <Heading
        level="h1"
        className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
      >
        Sign in to add products to the cart
      </Heading>
      <Text className="text-base-regular mt-4 mb-6 max-w-[32rem]">
        Sign into your account for the full experience. See product prices, add
        them to the cart, and check out.
      </Text>
      <div>
        <InteractiveLink href="/account">Sign in</InteractiveLink>
      </div>
    </div>
  )
}

export default SignInPrompt
