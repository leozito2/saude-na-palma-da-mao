"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Pill, Home } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    {
      label: "Dashboard",
      icon: Home,
      path: "/dashboard",
    },
    {
      label: "Consultas",
      icon: Calendar,
      path: "/appointments",
    },
    {
      label: "Medicamentos",
      icon: Pill,
      path: "/medications",
    },
  ]

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <nav className="flex gap-2 overflow-x-auto">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={pathname === item.path ? "default" : "outline"}
              onClick={() => router.push(item.path)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </nav>
      </CardContent>
    </Card>
  )
}
