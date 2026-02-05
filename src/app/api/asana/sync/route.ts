import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role for server-side operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ASANA_API_BASE = 'https://app.asana.com/api/1.0'

// Point configuration - Updated
const POINT_CONFIG: Record<string, number> = {
    S1: 3, S2A: 2, S2B: 2.5, S3A: 2,
    S3B: 5, S4: 5, S5: 6, S6: 7,
    S7: 10, S8: 48, S9A: 2.5, S9B: 4, S9C: 7,
}

interface AsanaTask {
    gid: string
    name: string
    completed: boolean
    completed_at: string | null
    due_on: string | null
    notes: string | null
    assignee: { gid: string; name: string; email?: string } | null
    custom_fields: Array<{
        name: string
        display_value: string | null
        number_value: number | null
        enum_value: { name: string } | null
    }>
    tags: Array<{ name: string }>
}

export async function POST() {
    const startTime = new Date()

    // Create sync log
    const { data: syncLog, error: logError } = await supabase
        .from('sync_logs')
        .insert({
            started_at: startTime.toISOString(),
            status: 'running',
            tasks_processed: 0,
            tasks_updated: 0,
        })
        .select()
        .single()

    if (logError) {
        return NextResponse.json({ error: 'Failed to create sync log' }, { status: 500 })
    }

    try {
        const token = process.env.ASANA_ACCESS_TOKEN
        const projectId = process.env.ASANA_PROJECT_ID

        if (!token || !projectId) {
            throw new Error('Missing ASANA_ACCESS_TOKEN or ASANA_PROJECT_ID')
        }

        // Fetch all tasks from Asana
        const allTasks: AsanaTask[] = []
        let offset: string | undefined

        do {
            const url = new URL(`${ASANA_API_BASE}/projects/${projectId}/tasks`)
            url.searchParams.set('opt_fields', 'gid,name,notes,completed,completed_at,due_on,assignee,assignee.name,assignee.email,custom_fields,custom_fields.name,custom_fields.display_value,custom_fields.number_value,custom_fields.enum_value,tags,tags.name')
            url.searchParams.set('limit', '100')
            if (offset) url.searchParams.set('offset', offset)

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Asana API error: ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            allTasks.push(...data.data)
            offset = data.next_page?.offset
        } while (offset)

        // Process and upsert tasks
        let tasksUpdated = 0

        for (const task of allTasks) {
            // Find Video Type 
            const videoTypeField = task.custom_fields?.find(
                f => f.name.toLowerCase().includes('video type') ||
                    f.name.toLowerCase().includes('videotype') ||
                    f.name.toLowerCase() === 'type'
            )
            const videoType = videoTypeField?.enum_value?.name ||
                videoTypeField?.display_value ||
                null

            // Find Quantity
            const quantityField = task.custom_fields?.find(
                f => f.name.toLowerCase().includes('quantity') ||
                    f.name.toLowerCase().includes('count') ||
                    f.name.toLowerCase() === 'qty'
            )
            const videoCount = Math.max(1, quantityField?.number_value || 1)

            // Find CTST (Creative Tool)
            const ctstField = task.custom_fields?.find(
                f => f.name.toLowerCase() === 'ctst' ||
                    f.name.toLowerCase().includes('creative tool')
            )
            const ctst = ctstField?.enum_value?.name ||
                ctstField?.display_value ||
                null

            // Calculate points
            const points = videoType ? (POINT_CONFIG[videoType] || 0) * videoCount : 0

            const taskData = {
                asana_id: task.gid,
                name: task.name,
                description: task.notes || null,
                assignee_name: task.assignee?.name || null,
                assignee_email: task.assignee?.email || null,
                status: task.completed ? 'done' : 'not_done',
                completed_at: task.completed_at,
                due_date: task.due_on,
                video_type: videoType,
                video_count: videoCount,
                points: points,
                ctst: ctst,
                tags: task.tags?.map(t => t.name) || [],
                raw_data: task,
                updated_at: new Date().toISOString(),
            }

            const { error } = await supabase
                .from('tasks')
                .upsert(taskData, { onConflict: 'asana_id' })

            if (!error) tasksUpdated++
        }

        // Update sync log
        await supabase
            .from('sync_logs')
            .update({
                ended_at: new Date().toISOString(),
                status: 'success',
                tasks_processed: allTasks.length,
                tasks_updated: tasksUpdated,
            })
            .eq('id', syncLog.id)

        return NextResponse.json({
            success: true,
            tasksProcessed: allTasks.length,
            tasksUpdated,
            duration: Date.now() - startTime.getTime(),
        })

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        await supabase
            .from('sync_logs')
            .update({
                ended_at: new Date().toISOString(),
                status: 'error',
                error_message: message,
            })
            .eq('id', syncLog.id)

        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function GET() {
    // Get latest sync status
    const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ logs: data })
}
