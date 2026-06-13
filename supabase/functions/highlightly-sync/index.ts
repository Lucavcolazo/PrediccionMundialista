import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const highlightlyHost = 'football-highlights-api.p.rapidapi.com'
const highlightlyKey = Deno.env.get('HIGHLIGHTLY_API_KEY')
const leagueId = '1635'
const season = '2026'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint } = await req.json()
    if (!endpoint || (endpoint !== 'standings' && endpoint !== 'matches' && endpoint !== 'countries')) {
      throw new Error('Invalid endpoint specified')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl) throw new Error('Missing SUPABASE_URL')
    if (!supabaseServiceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: cached, error: cacheError } = await supabase
      .from('api_cache')
      .select('data, updated_at')
      .eq('endpoint', endpoint)
      .maybeSingle()

    if (cacheError) {
      console.error('Cache query error:', cacheError)
    }

    let isStale = true
    if (cached && cached.updated_at) {
      const now = new Date().getTime()
      const updated = new Date(cached.updated_at).getTime()
      const diffMinutes = (now - updated) / (1000 * 60)
      if (endpoint === 'countries') isStale = diffMinutes > 60 * 24
      else if (endpoint === 'standings') isStale = diffMinutes > 30
      else if (endpoint === 'matches') isStale = diffMinutes > 3
    }

    if (!isStale && cached) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!highlightlyKey) {
      throw new Error('HIGHLIGHTLY_API_KEY is not set in Edge Function secrets')
    }

    let fetchUrl = ''
    if (endpoint === 'countries') {
      fetchUrl = 'https://soccer.highlightly.net/countries'
    } else {
      fetchUrl = `https://soccer.highlightly.net/${endpoint}?leagueId=${leagueId}&season=${season}`
      if (endpoint === 'matches') fetchUrl += '&limit=100'
    }

    let data
    try {
      const res = await fetch(fetchUrl, {
        headers: {
          'x-rapidapi-host': highlightlyHost,
          'x-rapidapi-key': highlightlyKey
        }
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Highlightly API error: ${res.status} - ${text}`)
      }

      data = await res.json()
    } catch (apiError) {
      // Live fetch failed (e.g. 429 daily limit). Serve the last cached real
      // data instead of falling back to mock, even if it's stale.
      if (cached && cached.data) {
        console.warn(`Live fetch failed for ${endpoint} (${apiError.message}); serving stale cache.`)
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw apiError
    }

    const { error: upsertError } = await supabase
      .from('api_cache')
      .upsert({ endpoint, data, updated_at: new Date().toISOString() }, { onConflict: 'endpoint' })

    if (upsertError) {
      console.error('Failed to update cache:', upsertError)
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    // Return 200 with error property so frontend can log it easily
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
