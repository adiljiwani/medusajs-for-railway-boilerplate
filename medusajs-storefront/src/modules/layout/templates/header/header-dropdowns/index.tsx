"use client"

import Dropdown from "@modules/layout/templates/header/header-dropdowns/dropdown"
import { DropdownOption } from "types/global"

const HeaderDropdowns = ({
  categories,
  unlockedPhones,
  brands,
  devices,
}: {
  categories: DropdownOption[]
  unlockedPhones: DropdownOption[]
  brands: DropdownOption[]
  devices: DropdownOption[]
}) => {
  return (
    <div className="flex items-center gap-x-1 h-full">
      <Dropdown title="Unlocked Phones" options={unlockedPhones} />
      <Dropdown title="Shop by Category" options={categories} />
      <Dropdown title="Shop by Brand" options={brands} />
      <Dropdown title="Shop by Device" options={devices} />
    </div>
  )
}

export default HeaderDropdowns
