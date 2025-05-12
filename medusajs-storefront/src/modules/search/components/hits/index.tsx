import { clx } from "@medusajs/ui"
import React from "react"
import {
  UseHitsProps,
  useHits,
  useSearchBox,
} from "react-instantsearch-hooks-web"

import { ProductHit } from "../hit"
import ShowAll from "../show-all"

type HitsProps<THit> = React.ComponentProps<"div"> &
  UseHitsProps & {
    hitComponent: (props: { hit: THit }) => JSX.Element
  }

const Hits = ({
  hitComponent: Hit,
  className,
  ...props
}: HitsProps<ProductHit>) => {
  const { query } = useSearchBox()
  const { hits } = useHits(props)
  const width = typeof window !== "undefined" ? window.innerWidth : 0
  const previewLimit = width > 640 ? 25 : 10

  return (
    <div
      className={clx(
        "transition-[height,max-height,opacity] duration-300 ease-in-out sm:overflow-hidden w-full sm:w-[75vw] mb-1 p-px",
        className,
        {
          "max-h-full opacity-100": !!query,
          "max-h-0 opacity-0": !query && !hits.length,
        }
      )}
    >
      <div 
        className="max-h-[80vh] overflow-y-auto"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div
          className="grid grid-cols-1 sm:grid-cols-3 medium:grid-cols-5 gap-4 mb-4"
          data-testid="search-results"
        >
          {hits.slice(0, previewLimit).map((hit, index) => (
            <li
              key={index}
              className="list-none"
            >
              <Hit hit={hit as unknown as ProductHit} />
            </li>
          ))}
        </div>
        <ShowAll />
      </div>
    </div>
  )
}

export default Hits
