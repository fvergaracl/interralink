import React, { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/router"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons"
import { MdOutlineAssignment } from "react-icons/md"
import Breadcrumb from "../../../components/Breadcrumbs/Breadcrumb"
import DefaultLayout from "../../../components/AdminLayout"

interface Task {
  id: string
  title: string
  description: string | null
  type: string
  disabled: boolean
  pointOfInterest: {
    id: string
    name: string
    area: {
      id: string
      name: string
      campaign: {
        id: string
        name: string
      }
    }
  }
  created_at: string
  updated_at: string
}

export default function AdminTasks() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const pageSize = 10

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get("/api/admin/tasks")
        setTasks(response.data)
        setFilteredTasks(response.data)
      } catch (err) {
        console.error("Failed to fetch tasks:", err)
      }
    }

    fetchTasks()
  }, [])

  useEffect(() => {
    const filtered = tasks.filter(
      task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredTasks(filtered)
    setCurrentPage(1)
  }, [searchQuery, tasks])

  const handleView = (id: string) => {
    router.push(`/admin/tasks/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/tasks/${id}/edit`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handlePageChange = (direction: "prev" | "next") => {
    setCurrentPage(prev =>
      direction === "prev"
        ? Math.max(prev - 1, 1)
        : Math.min(prev + 1, Math.ceil(filteredTasks.length / pageSize))
    )
  }

  const startIndex = (currentPage - 1) * pageSize
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + pageSize)

  return (
    <DefaultLayout>
      <Breadcrumb
        icon={<MdOutlineAssignment />}
        pageName='Tasks'
        breadcrumbPath='Tasks'
      />

      <div className='overflow-x-auto rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark'>
        <div className='flex items-center gap-4 mb-4'>
          <input
            type='text'
            placeholder='Search by title or description'
            value={searchQuery}
            onChange={handleSearchChange}
            className='w-full p-2 border border-gray-300 rounded-md focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
          />
        </div>

        <table className='min-w-full table-auto border-collapse'>
          <thead>
            <tr className='bg-gray-100 text-left text-sm font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300'>
              <th className='border px-4 py-2'>#</th>
              <th className='border px-4 py-2'>Title</th>
              <th className='border px-4 py-2'>Description</th>
              <th className='border px-4 py-2'>Type</th>
              <th className='border px-4 py-2'>POI</th>
              <th className='border px-4 py-2'>Area</th>
              <th className='border px-4 py-2'>Campaign</th>
              <th className='border px-4 py-2'>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedTasks.map((task, index) => (
              <tr
                key={task.id}
                className='hover:bg-gray-50 dark:hover:bg-gray-700'
              >
                <td className='border px-4 py-2'>{startIndex + index + 1}</td>
                <td className='border px-4 py-2 font-medium text-gray-800 dark:text-white'>
                  {task.title}
                </td>
                <td className='border px-4 py-2 text-sm text-gray-600 dark:text-gray-400'>
                  {task.description || "-"}
                </td>
                <td className='border px-4 py-2'>{task.type}</td>
                <td className='border px-4 py-2'>
                  {task.pointOfInterest.name}
                </td>
                <td className='border px-4 py-2'>
                  {task.pointOfInterest.area.name}
                </td>
                <td className='border px-4 py-2'>
                  {task.pointOfInterest.area.campaign.name}
                </td>
                <td className='border px-4 py-2'>
                  <div className='flex gap-2'>
                    <button
                      title='View'
                      onClick={() => handleView(task.id)}
                      className='rounded bg-blue-100 p-2 text-blue-600 hover:bg-blue-200'
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                      title='Edit'
                      onClick={() => handleEdit(task.id)}
                      className='rounded bg-yellow-100 p-2 text-yellow-600 hover:bg-yellow-200'
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      title='Delete'
                      className='rounded bg-red-100 p-2 text-red-600 hover:bg-red-200'
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className='flex justify-between mt-4'>
          <button
            onClick={() => handlePageChange("prev")}
            disabled={currentPage === 1}
            className='px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50'
          >
            Previous
          </button>
          <span>
            Page {currentPage} of{" "}
            {filteredTasks.length > 0
              ? Math.ceil(filteredTasks.length / pageSize)
              : "1"}
          </span>
          <button
            onClick={() => handlePageChange("next")}
            disabled={
              currentPage === Math.ceil(filteredTasks.length / pageSize)
            }
            className='px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50'
          >
            Next
          </button>
        </div>
      </div>
    </DefaultLayout>
  )
}
