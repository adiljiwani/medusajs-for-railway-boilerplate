"use client"

import { Fragment, useState } from "react"
import { Transition } from "@headlessui/react"
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid"
import { DropdownOption } from "types/global"
import Link from "next/link"
import React from "react"

// Helper function to check if children is an array of strings
const isStringArray = (children: DropdownOption[] | string[] | undefined): children is string[] => {
  return children ? (children.length === 0 || typeof children[0] === 'string') : false
}

// Helper function to check if option has children
const hasChildren = (option: DropdownOption): boolean => {
  return option.children && option.children.length > 0
}

// Reusable Link Component for Dropdown Options
const DropdownLink = ({
  option,
  closeDropdown,
  title,
}: {
  option: DropdownOption
  closeDropdown: () => void
  title: string
}) => {
  // Add filters to search params
  let searchParams = new URLSearchParams()
  
  // Add basic category and subcategory if they exist
  if (option.category_id) {
    searchParams.append("category_id", option.category_id)
  }
  if (option.subcategory_id) {
    searchParams.append("subcategory_id", option.subcategory_id)
  }
  
  // Add include filters if they exist
  if (option.include) {
    if (option.include.category_id) {
      option.include.category_id.forEach((id, index) => {
        searchParams.append(`include[category_id][${index}]`, id)
      })
    }
    if (option.include.subcategory_id) {
      option.include.subcategory_id.forEach((id, index) => {
        searchParams.append(`include[subcategory_id][${index}]`, id)
      })
    }
  }
  
  // Add exclude filters if they exist
  if (option.exclude) {
    if (option.exclude.category_id) {
      option.exclude.category_id.forEach((id, index) => {
        searchParams.append(`exclude[category_id][${index}]`, id)
      })
    }
    if (option.exclude.subcategory_id) {
      option.exclude.subcategory_id.forEach((id, index) => {
        searchParams.append(`exclude[subcategory_id][${index}]`, id)
      })
    }
  }
  
  // Add searchByTitle flag if it exists
  if (typeof option.searchByTitle !== 'undefined') {
    searchParams.append("searchByTitle", String(option.searchByTitle))
  }
  
  // For non-specific items (with children), just use the name as query
  const url = `/results/${encodeURIComponent(option.name)}?${searchParams.toString()}`
  
  return (
    <Link
      href={url}
      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex justify-between cursor-pointer"
      onClick={closeDropdown}
    >
      {option.name}
    </Link>
  )
}

const Dropdown = ({
  title,
  options,
}: {
  title: string
  options: DropdownOption[]
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeOptions, setActiveOptions] = useState<string[]>([])

  const handleMouseEnter = () => setIsOpen(true)
  const handleMouseLeave = () => {
    setIsOpen(false)
    setActiveOptions([])
  }

  const handleOptionMouseEnter = (name: string) => () => {
    setActiveOptions((prev) => [...prev, name])
  }
  
  const handleOptionMouseLeave = (name: string) => () => {
    setActiveOptions((prev) => prev.filter(n => n !== name))
  }

  // Close dropdown on link click
  const handleLinkClick = () => setIsOpen(false)

  const renderDropdownContent = (options: DropdownOption[], level: number = 0) => {
    return (
      <div className={`${level === 0 ? 'py-1' : ''}`}>
        {options.map((option) => (
          <div
            key={option.name}
            className="relative"
            onMouseEnter={handleOptionMouseEnter(option.name)}
            onMouseLeave={handleOptionMouseLeave(option.name)}
          >
            {!hasChildren(option) ? (
              <DropdownLink
                option={option}
                closeDropdown={handleLinkClick}
                title={title}
              />
            ) : (
              <div className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex justify-between cursor-pointer">
                {option.name}
                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
              </div>
            )}
            {hasChildren(option) && activeOptions.includes(option.name) && option.children && (
              <div className="absolute left-full top-0 w-48 bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {isStringArray(option.children) ? (
                  <div className="py-1">
                    {option.children.map((childName) => (
                      <DropdownLink
                        key={childName}
                        option={{
                          name: childName,
                          children: [],
                          category_id: option.category_id,
                          subcategory_id: option.subcategory_id
                        }}
                        closeDropdown={handleLinkClick}
                        title={title}
                      />
                    ))}
                  </div>
                ) : (
                  renderDropdownContent(option.children, level + 1)
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="relative inline-block text-left"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 hover:text-ui-fg-base cursor-pointer"
        aria-expanded={isOpen}
      >
        {title}
        <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1 text-gray-500" />
      </div>

      <Transition
        as={Fragment}
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="absolute left-0 z-10 w-56 mt-2 origin-top-left bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {renderDropdownContent(options)}
        </div>
      </Transition>
    </div>
  )
}

export default Dropdown
