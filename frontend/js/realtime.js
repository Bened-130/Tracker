// Initialize Supabase client with realtime
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class RealtimeService {
    constructor() {
        this.channels = new Map();
    }

    // Subscribe to attendance changes
    subscribeToAttendance(callback) {
        const channel = supabase
            .channel('attendance_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',          // Only new records
                    schema: 'public',
                    table: 'attendance'
                },
                (payload) => {
                    console.log('New attendance:', payload.new);
                    callback(payload.new);
                }
            )
            .subscribe();

        this.channels.set('attendance', channel);
        return channel;
    }

    // Subscribe to specific session
    subscribeToSession(sessionId, callback) {
        const channel = supabase
            .channel(`session_${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',               // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'attendance',
                    filter: `session_id=eq.${sessionId}`
                },
                (payload) => callback(payload)
            )
            .subscribe();

        return channel;
    }

    // Broadcast custom events (for manual notifications)
    async broadcastCheckIn(studentData) {
        await supabase.channel('checkin_updates').send({
            type: 'broadcast',
            event: 'student_checked_in',
            payload: {
                student_id: studentData.student_id,
                name: studentData.name,
                timestamp: new Date().toISOString(),
                confidence: studentData.confidence
            }
        });
    }

    unsubscribe(channelName) {
        const channel = this.channels.get(channelName);
        if (channel) {
            supabase.removeChannel(channel);
            this.channels.delete(channelName);
        }
    }
}

const realtime = new RealtimeService();

// Usage in dashboard
realtime.subscribeToAttendance((newRecord) => {
    // Update UI instantly
    addActivityToFeed(newRecord);
    updateStatsCounter();
    playNotificationSound();
});