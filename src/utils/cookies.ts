import { NextApiResponse, NextApiRequest } from "next"
import cookie from "cookie"

/**
 * Defines common cookie configuration options.
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // secure: false,
  sameSite: "lax",
  path: "/"
}

/**
 * Sets multiple cookies in the response.
 * @param res - Next.js HTTP response
 * @param cookies - Object containing cookies to set
 * @param maxAge - Optional max age for the cookies in seconds
 */
export const setCookies = (
  res: NextApiResponse,
  cookies: Record<string, string | null>,
  maxAge?: number
) => {
  const validCookies = Object.entries(cookies)
    .filter(([_, value]) => typeof value === "string" && value.trim() !== "") // Ensure value is valid
    .map(([key, value]) =>
      cookie.serialize(key, value as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: value ? maxAge : 0,
        path: "/"
      })
    )

  if (validCookies.length > 0) {
    res.setHeader("Set-Cookie", validCookies)
  } else {
    console.warn("setCookies: No valid cookies to set.")
  }
}

/**
 * Clears all cookies set in the response.
 * @param res - Next.js HTTP response
 * @param req - Next.js HTTP request (used to read current cookies)
 */
export const clearCookies = (req: NextApiRequest, res: NextApiResponse) => {
  if (!req.headers.cookie) return

  const parsedCookies = cookie.parse(req.headers.cookie)
  const expiredCookies = Object.keys(parsedCookies).map(cookieName =>
    cookie.serialize(cookieName, "", {
      ...COOKIE_OPTIONS,
      expires: new Date(0)
    })
  )

  res.setHeader("Set-Cookie", expiredCookies)
}

/**
 * Retrieves cookies from the request.
 * @param req - Next.js HTTP request
 * @returns An object containing parsed cookies
 */
export const getCookies = (req: NextApiRequest): Record<string, string> => {
  if (!req.headers.cookie) return {}
  return cookie.parse(req.headers.cookie)
}
