import { serve } from "@hono/node-server"
import { Hono } from 'hono'
import { prisma } from './lib/prisma'

const app = new Hono()

app.get('/', (c) => c.json({ message: 'TechConnect API is running' }))


app.get('/health', async (c) => {
    await prisma.$queryRaw`SELECT 1`
    return c.json({ db: 'connected' })
})

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
})