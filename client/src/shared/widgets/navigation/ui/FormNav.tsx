import { PlusIcon } from "lucide-react"

import { useState } from "react"

const formRoures = [
  {
    path: "/events/create",
    title: "Event",
    icon: "create",
  },
  {
    path: "/places/create",
    title: "Place",
    icon: "create",
  }
]

export const FormNav = () => {
  const [open, setOpen] = useState(false);

  function toggleOpen() {
    setOpen(open => !open)
  }

  return (
    <button
      className="bg-secondary h-14 aspect-square rounded-full flex justify-center items-center"
      onClick={toggleOpen}
    >
        <PlusIcon className="stroke-white size-8"/>
    </button>
  )
}
