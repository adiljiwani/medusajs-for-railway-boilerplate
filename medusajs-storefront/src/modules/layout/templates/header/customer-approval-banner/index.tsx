import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { InformationCircleIcon } from "@heroicons/react/24/solid"

const CustomerApprovalBanner = () => {
  return (
    <div className="bg-red-100 text-red-700 text-center py-2 flex justify-center items-center space-x-2">
      <InformationCircleIcon className="w-5 h-5 text-red-700" />
      <p className="text-sm font-medium">
        Your account status is set to <strong>unapproved</strong>. Please{" "}
        <LocalizedClientLink
          href="/contact"
          className="text-blue-600 underline"
        >
          get in touch
        </LocalizedClientLink>{" "}
        with us to change this.
      </p>
    </div>
  )
}

export default CustomerApprovalBanner
