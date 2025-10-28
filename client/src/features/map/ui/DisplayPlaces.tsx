import { placesQueries } from "@/entities/place"
import { useQuery } from "@tanstack/react-query"
import { Circle } from "./components/circle"

export const DisplayPlaces = () => {
  const {data: places} = useQuery(placesQueries.list())
  if (!places) {
    return
  }

  return(
    <>
      {
        places.map((place) =>
          <Circle key={place.id} center={place.geometry.coordinates[0]} radius={50} strokeColor="#76ff05" fillColor="#76ff05"/>
        )
      }
    </>
  )
}
