import { placesQueries } from "@/entities/place"
import { useQuery } from "@tanstack/react-query"
import { AdvancedMarker } from "@vis.gl/react-google-maps"
import { Pin } from "lucide-react"

export const DisplayPlaces = () => {
  const {data: places} = useQuery(placesQueries.list())
  if (!places) {
    return
  }

  return(
    <>
      {
        places.map((place) =>
        <AdvancedMarker key={place.id} position={place.geometry.coordinates[0]} >
            <Pin>
            </Pin>
        </AdvancedMarker>)
      }
    </>
  )
}
