import React, { useEffect } from "react"
import axios from "axios"
import { RiUserCommunityFill } from "react-icons/ri"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb"
import DefaultLayout from "@/components/AdminLayout"
import { API_BASE_URL } from "@/config/api"
import { useTranslation } from "@/hooks/useTranslation"

export default function AdminUsersActivityLogs() {
  const { t } = useTranslation()

  useEffect(() => {
    const fetchUsersLogs = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/admin/activity-logs/users`
        )
        console.log("Users logs:", response.data)
      } catch (error) {
        console.error("Error fetching users logs:", error)
      }
    }
    fetchUsersLogs()
  }, [])

  return (
    <DefaultLayout>
      <Breadcrumb
        icon={<RiUserCommunityFill />}
        pageName={t("Users Activity Logs")}
        breadcrumbPath={t("Users Activity Logs")}
      />
    </DefaultLayout>
  )
}
