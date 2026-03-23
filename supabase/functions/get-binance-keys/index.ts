import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { decryptAES } from '../_shared/aes.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('BINANCE_ENCRYPTION_KEY')!;
    const encryptionIv = Deno.env.get('BINANCE_ENCRYPTION_IV')!;

    if (!encryptionKey || !encryptionIv) {
      return new Response(JSON.stringify({ error: 'Encryption keys not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(userToken);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabase
      .from('encrypted_binance_keys')
      .select('encrypted_api_key, encrypted_secret_key')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'No keys found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // فك التشفير AES
    const apiKey = await decryptAES(data.encrypted_api_key, encryptionKey, encryptionIv);
    const secretKey = await decryptAES(data.encrypted_secret_key, encryptionKey, encryptionIv);

    return new Response(JSON.stringify({ apiKey, secretKey }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
