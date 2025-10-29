"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, User } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function DashboardHeader() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const today = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-1">Olá, {user?.name}!</h1>
            <p className="text-muted-foreground capitalize">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            <Button variant="outline" onClick={handleLogout} className="bg-transparent">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
