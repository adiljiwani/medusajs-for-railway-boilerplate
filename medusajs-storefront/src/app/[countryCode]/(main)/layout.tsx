import { Metadata } from "next"
import { getCustomer, listCategories, listUnlockedPhones, listBrands, listDevices } from "@lib/data"
import Footer from "@modules/layout/templates/footer"
// import Nav from "@modules/layout/templates/nav"
import Header from "@modules/layout/templates/header"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const [customer, categories, unlockedPhones, brands, devices] = await Promise.all([
    getCustomer().catch(() => null),
    listCategories(),
    listUnlockedPhones(),
    listBrands(),
    listDevices(),
  ])

  return (
    <>
      {/* <Nav /> */}
      <Header 
        customer={customer}
        categories={categories}
        unlockedPhones={unlockedPhones}
        brands={brands}
        devices={devices}
      />
      {props.children}
      <Footer />
    </>
  )
}
