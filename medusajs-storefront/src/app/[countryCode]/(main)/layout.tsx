import { Metadata } from "next"
import { getCustomer } from "@lib/data"
import Footer from "@modules/layout/templates/footer"
// import Nav from "@modules/layout/templates/nav"
import Header from "@modules/layout/templates/header"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const customer = await getCustomer().catch(() => null)

  return (
    <>
      {/* <Nav /> */}
      <Header customer={customer} />
      {props.children}
      <Footer />
    </>
  )
}
