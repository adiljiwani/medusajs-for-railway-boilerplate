import { Metadata } from "next"
import { getCustomer, listCategories, listUnlockedPhones, listBrands, listDevices } from "@lib/data"
import Footer from "@modules/layout/templates/footer"
// import Nav from "@modules/layout/templates/nav"
import HeaderWrapper from "@modules/layout/templates/header/header-wrapper"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const customer = await getCustomer().catch(() => null)
  const categories = await listCategories()
  const unlockedPhones = await listUnlockedPhones()
  const brands = await listBrands()
  const devices = await listDevices()

  return (
    <>
      {/* <Nav /> */}
      <HeaderWrapper />
      {props.children}
      <Footer />
    </>
  )
}
