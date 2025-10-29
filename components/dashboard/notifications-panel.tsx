"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { emailService, type EmailNotification } from "@/lib/email-service"
import { Mail, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function NotificationsPanel() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<EmailNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const userNotifications = await emailService.getNotifications(user.id)
      setNotifications(userNotifications.slice(0, 5)) // Show only last 5
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
    setIsLoading(false)
  }

  const processNotifications = async () => {
    await emailService.processPendingNotifications()
    loadNotifications()
  }

  useEffect(() => {
    loadNotifications()
  }, [user])

  const getStatusIcon = (status: EmailNotification["status"]) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: EmailNotification["status"]) => {
    switch (status) {
      case "sent":
        return "Enviado"
      case "failed":
        return "Falhou"
      case "pending":
        return "Pendente"
      default:
        return status
    }
  }

  const getTypeText = (type: EmailNotification["type"]) => {
    switch (type) {
      case "appointment_reminder":
        return "Lembrete de Consulta"
      case "medication_reminder":
        return "Lembrete de Medicamento"
      case "password_reset":
        return "Recuperação de Senha"
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-primary">Notificações por Email</CardTitle>
            <CardDescription>Histórico de emails enviados</CardDescription>
          </div>
          <Button onClick={processNotifications} size="sm" variant="outline">
            Processar Pendentes
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando notificações...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Nenhuma notificação encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card key={notification.id} className="border-l-4 border-l-primary/20">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(notification.status)}
                        <Badge variant="outline" className="text-xs">
                          {getStatusText(notification.status)}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(notification.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm">{getTypeText(notification.type)}</h4>
                      <p className="text-xs text-muted-foreground">{notification.subject}</p>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <div>Para: {notification.recipient}</div>
                      {notification.status === "sent" && notification.sentAt && (
                        <div>Enviado: {format(notification.sentAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                      )}
                      {notification.status === "pending" && (
                        <div>Agendado: {format(notification.scheduledFor, "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
