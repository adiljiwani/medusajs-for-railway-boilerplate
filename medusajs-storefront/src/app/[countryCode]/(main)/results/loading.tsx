import Spinner from "@modules/common/icons/spinner"

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
      <Spinner size={36} />
    </div>
  )
}
