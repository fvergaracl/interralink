import { useRouter } from "next/router"
import React, { useEffect, useMemo, useState, useRef, use } from "react"
import ReactDOMServer from "react-dom/server"
import {
  MapContainer as LeafletMapContainer,
  Circle,
  Tooltip,
  TileLayer,
  Marker,
  Polygon,
  Popup
} from "react-leaflet"
import L, { DivIcon } from "leaflet"
import "leaflet-routing-machine"
import LeafletRoutingMachine from "leaflet-routing-machine"
import CustomMarker from "../Mapmarker"
import "leaflet/dist/leaflet.css"
import { useDashboard, DashboardContextType } from "@/context/DashboardContext"
import { useAdmin, AdminContextType } from "@/context/AdminContext"
import MapControls from "./MapControls"
import { useTranslation } from "@/hooks/useTranslation"
import FitBounds from "./FitBounds"
import "../styles.css"
import {
  Point,
  Task,
  PolygonData,
  CampaignData,
  PointOfInterest
} from "./types"

interface MapProps {
  showMyLocation?: boolean
  points: Point[]
  polygons: PolygonData[]
  polygonsMultiColors?: boolean
  polygonsTitle?: boolean
  polygonsFitBounds?: boolean
  clickOnPolygon?: (polygon: PolygonData) => void
  selectedCampaign: CampaignData | null
  modeView?: "contribuitor-view" | "admin-view"
  showMapControl?: boolean
}
interface IdistanceToPoi {
  kilometters: number | null
  metters: number | null
}

type ContextType = {
  mapCenter: [number, number]
  position: { lat: number; lng: number } | null
  isTracking: boolean
}

export const useContextMapping = ():
  | DashboardContextType
  | AdminContextType
  | ContextType => {
  const router = useRouter()

  const isDashboard = router.pathname.startsWith("/dashboard")
  const isAdmin = router.pathname.startsWith("/admin")

  if (isAdmin) {
    return useAdmin()
  }

  if (isDashboard) {
    return useDashboard()
  }

  return {
    mapCenter: [0, 0],
    position: null,
    isTracking: false
  }
}

const colors = [
  { border: "blue", fill: "lightblue" },
  { border: "red", fill: "pink" },
  { border: "green", fill: "lightgreen" },
  { border: "purple", fill: "plum" },
  { border: "orange", fill: "peachpuff" }
]
const Routing = ({ map, start, end, routingControlRef }) => {
  useEffect(() => {
    if (!map || !start || !end) return

    if (routingControlRef.current) {
      console.log("Actualizando waypoints de la ruta sin eliminarla...")
      routingControlRef.current
        .getPlan()
        .setWaypoints([
          L.latLng(start.lat, start.lng),
          L.latLng(end.lat, end.lng)
        ])
      return
    }

    try {
      routingControlRef.current = L.Routing.control({
        waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
        router: new L.Routing.OSRMv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
          profile: "foot"
        }),
        routeWhileDragging: true,
        lineOptions: {
          styles: [{ color: "#FF0000", opacity: 1, weight: 5 }]
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        createMarker: () => null
      }).addTo(map)
    } catch (error) {
      console.error("Error al inicializar la ruta:", error)
    }

    return () => {}
  }, [map, start, end])

  return null
}

export default function Map({
  showMyLocation = false,
  points = [],
  polygons = [],
  polygonsMultiColors = true,
  polygonsTitle = false,
  polygonsFitBounds = false,
  clickOnPolygon = undefined,
  selectedCampaign,
  modeView = "contribuitor-view",
  showMapControl = false
}: MapProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const { mapCenter, position, isTracking } = useContextMapping()
  const mapRef = useRef<L.Map | null>(null)
  const [campaignData, setCampaignData] = useState<any>(null)
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(null)
  const [errorPoi, setErrorPoi] = useState<any>(null)
  const [distanceToPoi, setDistanceToPoi] = useState<IdistanceToPoi>({
    kilometters: null,
    metters: null
  })
  const routingControlRef = useRef<L.Routing.Control | null>(null)
  const [selectedPolygon, setSelectedPolygon] = useState<PolygonData | null>(
    null
  )

  const removeRoute = () => {
    setSelectedPoi(null)
    setDistanceToPoi(null)
    if (routingControlRef.current) {
      try {
        if (routingControlRef.current) {
          routingControlRef.current.getPlan().setWaypoints([])
        }
      } catch (error) {
        console.error("Error al limpiar la ruta:", error)
      }
    }
  }

  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {}

  const createCustomIcon = (color: string, size: number) => {
    const markerHtml = ReactDOMServer.renderToString(
      <CustomMarker markerColor={color} size={size} />
    )

    return L.divIcon({
      html: markerHtml,
      className: "custom-marker",
      iconSize: [size, size],
      iconAnchor: [size / 2, size]
    })
  }

  const handleSelectPoi = (poi: PointOfInterest | null) => {
    setSelectedPoi(poi)
  }

  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!selectedCampaign) return
      const res = await fetch(`/api/campaigns/${selectedCampaign?.id}`)
      const resJson = await res.json()
      setCampaignData(resJson)
    }

    fetchCampaignData()
  }, [selectedCampaign])

  const markerIcon = useMemo(() => {
    if (isTracking) {
      return new DivIcon({
        className: "blinking-marker-icon",
        html: `
          <div class="blinking-marker">
            <div class="inner-circle"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    } else {
      removeRoute()
      setErrorPoi(null)
      setSelectedPoi(null)
      setDistanceToPoi(null)
      return new DivIcon({
        className: "static-marker-icon",
        html: `
          <div class="static-marker">
            <div class="inner-circle"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }
  }, [isTracking])

  useEffect(() => {
    if (selectedPoi) {
      checkTaskAndPoi(selectedPoi)
    }
  }, [selectedPoi])

  const firstDivClassName =
    modeView === "contribuitor-view" ? "h-[calc(100vh-4rem)]" : "h-96"

  const secondDivClassName =
    modeView === "contribuitor-view"
      ? `${selectedPoi ? "h-[70%]" : "h-full"} transition-all duration-300`
      : "h-full"

  const checkTaskAndPoi = (poi: PointOfInterest) => {
    console.log("********** CHECK POI")
    console.log({ poi, position })
    const destination = L.latLng(poi.latitude, poi.longitude)
    // calculate distance between current position and destination

    const distance = mapRef.current?.distance(
      L.latLng(position.lat, position.lng),
      destination
    )
    console.log({ distance })
    if (distance && distance <= poi.radius) {
      if (poi.tasks.length > 0) {
        handleSelectPoi(poi)
      } else {
        setErrorPoi("This point of interest has no tasks")
      }
    } else {
      setErrorPoi("You are not close enough to this point of interest")
    }
  }
  let messageDistance = ""
  if (selectedPoi && distanceToPoi.kilometters === null) {
    messageDistance = "Calculating distance..."
  }
  if (selectedPoi && distanceToPoi.kilometters !== null) {
    messageDistance = `You are ${distanceToPoi.kilometters} km and ${distanceToPoi.metters} m away from the point of interest`
  }
  if (selectedPoi && distanceToPoi.kilometters === 0 && distanceToPoi.metters === 0) { 
    messageDistance = "You are in the point of interest"
  }
  if (selectedPoi && distanceToPoi.kilometters === 0 && distanceToPoi.metters !== 0) {
    messageDistance = `You are ${distanceToPoi.metters} m away from the point of interest`
  } 
  if (selectedPoi && distanceToPoi.kilometters !== 0 && distanceToPoi.metters === 0) {
    messageDistance = `You are ${distanceToPoi.kilometters} km away from the point of interest`
  }
  

  return (
    <>
      <div className={firstDivClassName} data-cy='map-container-for-dashboard'>
        <div className={secondDivClassName}>
          <LeafletMapContainer
            center={mapCenter || [0, 0]}
            zoom={mapCenter ? 16 : 13}
            style={{ height: "100%", width: "100%" }}
            data-cy='map-container-for-dashboard'
            whenReady={event => {
              mapRef.current = event.target
            }}
          >
            {distanceToPoi && (
              <div className='absolute z-500 mx-auto top-0 left-0 right-0 bg-white dark:bg-green-500 shadow-lg rounded-b-lg p-3 text-center'>
                {`You are ${distanceToPoi.kilometters} km and ${distanceToPoi.metters} m away from the point of interest`}
              </div>
            )}

            <TileLayer
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {showMapControl && isTracking && (
              <MapControls
                position={position}
                removeRoute={selectedPoi && removeRoute}
                campaignData={campaignData}
              />
            )}
            {isTracking &&
              polygons?.map((polygon, index) => {
                if (polygonsMultiColors) {
                  const color = colors[index % colors.length]
                  return (
                    <Polygon
                      key={polygon.id}
                      positions={polygon.polygon}
                      pathOptions={{
                        color: color.border,
                        fillColor: color.fill,
                        fillOpacity: 0.5
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedPolygon(polygon)
                          if (clickOnPolygon) clickOnPolygon(polygon)
                        }
                      }}
                    >
                      {polygonsTitle && <Tooltip>{polygon.name}</Tooltip>}
                      {selectedPolygon?.id === polygon.id && (
                        <Popup>
                          <div>
                            <h3>
                              <strong></strong>
                              {polygon.name}
                            </h3>
                            <p>
                              <strong>Description:</strong>
                              {polygon.description}
                            </p>
                            <button
                              onClick={() => {
                                router.push(`/admin/areas/${polygon.id}`)
                              }}
                              className='text-blue-600 underline'
                            >
                              {t("See more")}
                            </button>
                          </div>
                        </Popup>
                      )}
                    </Polygon>
                  )
                }
                return (
                  <Polygon
                    key={index}
                    positions={polygon.coordinates}
                    pathOptions={{ color: "blue", weight: 2 }}
                  />
                )
              })}
            {isTracking &&
              points?.map((point, index) => (
                <Marker
                  key={index}
                  position={[point.lat, point.lng]}
                  icon={L.icon({
                    iconUrl: "/marker-icon.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                  })}
                />
              ))}
            {isTracking &&
              campaignData?.areas?.map(
                (area: {
                  id: string
                  name: string
                  description: string
                  polygon: [number, number][]
                  pointOfInterests: any[]
                }) => (
                  <Polygon
                    key={area.id}
                    positions={area.polygon}
                    pathOptions={{ color: "blue", weight: 2 }}
                  >
                    <Popup>
                      <h3>{area.name}</h3>
                      <p>{area.description}</p>
                    </Popup>
                  </Polygon>
                )
              )}
            {isTracking &&
              campaignData?.areas
                ?.flatMap(
                  (area: { pointOfInterests: any }) => area?.pointOfInterests
                )
                .map((poi: PointOfInterest) => (
                  <>
                    <Circle
                      key={`${poi.id}-circle`}
                      center={[poi.latitude, poi.longitude]}
                      radius={poi.radius}
                      pathOptions={{ color: "green", fillOpacity: 0.2 }}
                      eventHandlers={{
                        click: () => {
                          if (selectedPoi?.id === poi?.id) {
                            handleSelectPoi(null)
                          } else {
                            handleSelectPoi(poi)
                          }
                        }
                      }}
                    />
                    <Marker
                      key={poi.id}
                      position={[poi.latitude, poi.longitude]}
                      icon={createCustomIcon("green", 36)}
                      eventHandlers={{
                        click: () => {
                          if (selectedPoi) {
                            setSelectedPoi(null)
                            setDistanceToPoi(null)
                            return
                          }
                          handleSelectPoi(poi)
                        }
                      }}
                    ></Marker>
                  </>
                ))}
            {showMyLocation && position && (
              <Marker position={[position.lat, position.lng]} icon={markerIcon}>
                <Popup>
                  <h3>{t("Your current location")}</h3>
                </Popup>
              </Marker>
            )}
            {isTracking && polygonsFitBounds && (
              <FitBounds polygons={polygons} />
            )}
            {isTracking && selectedPoi && position && mapRef.current && (
              <Routing
                map={mapRef.current}
                start={{ lat: position.lat, lng: position.lng }}
                end={{ lat: selectedPoi.latitude, lng: selectedPoi.longitude }}
                routingControlRef={routingControlRef}
              />
            )}
          </LeafletMapContainer>
        </div>
        {isTracking && selectedPoi && (
          <div className='h-[30%] overflow-y-auto bg-white dark:bg-gray-900 shadow-lg rounded-t-lg p-3'>
            <span className='justify-between flex items-center'>
              {" "}
              <h4
                className='text-lg font-bold text-gray-900 dark:text-slate-100'
                data-cy='poi-name'
              >
                {selectedPoi.name}{" "}
                {errorPoi && (
                  <span className='text-red-500'>{t(errorPoi)}</span>
                )}
              </h4>
            </span>

            {selectedPoi.tasks.length > 0 && (
              <div className='mt-2'>
                <h4
                  data-cy='poi-tasks-title'
                  className='text-md font-semibold text-gray-900 dark:text-slate-100'
                >
                  {t("Tasks")}
                </h4>

                <div className='relative'>
                  <button
                    className='absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow focus:outline-none'
                    onClick={() => {
                      const container =
                        document.getElementById("tasks-container")
                      container?.scrollBy({ left: -300, behavior: "smooth" })
                    }}
                  >
                    ←
                  </button>

                  <div
                    id='tasks-container'
                    className='flex overflow-x-auto gap-4 scrollbar-hide scroll-smooth snap-x'
                  >
                    {selectedPoi.tasks.map((task: Task) => (
                      <div
                        key={task.id}
                        className='min-w-[300px] snap-start flex-shrink-0 p-4 border rounded-lg shadow bg-white dark:bg-gray-800 dark:border-gray-700'
                      >
                        <h5
                          className='text-md font-semibold text-gray-900 dark:text-slate-100 truncate'
                          data-cy={`task-title-${task.id}`}
                        >
                          {task.title}
                        </h5>
                        <p
                          className='text-sm text-gray-600 dark:text-gray-400 mt-1 truncate'
                          data-cy={`task-description-${task.id}`}
                        >
                          {task.description || t("No description available")}
                        </p>
                        <button
                          onClick={() =>
                            (window.location.href = `/dashboard/task/${task.id}`)
                          }
                          className='mt-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-400 text-center'
                          data-cy={`enter-task-${task.id}`}
                        >
                          {t("Enter Task")}
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    className='absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow focus:outline-none'
                    onClick={() => {
                      const container =
                        document.getElementById("tasks-container")
                      container?.scrollBy({ left: 300, behavior: "smooth" })
                    }}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
