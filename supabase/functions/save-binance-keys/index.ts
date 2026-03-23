import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { encryptAES } from '../_shared/aes.ts';

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

    const { apiKey, secretKey } = await req.json();
    if (!apiKey || !secretKey) {
      return new Response(JSON.stringify({ error: 'apiKey and secretKey are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // AES تشفير المفاتيح
    const encryptedApiKey = await encryptAES(apiKey, encryptionKey, encryptionIv);
    const encryptedSecretKey = await encryptAES(secretKey, encryptionKey, encryptionIv);

    // حفظ في encrypted_binance_keys
    await supabase.from('encrypted_binance_keys').upsert({
      user_id: user.id,
      encrypted_api_key: encryptedApiKey,
      encrypted_secret_key: encryptedSecretKey,
      is_active: true,
    }, { onConflict: 'user_id' });

    // حفظ في bot_config (مشفر) - upsert بناءً على user_id
    const { error: configError } = await supabase
      .from('bot_config')
      .upsert({
        user_id: user.id,
        binance_api_key: encryptedApiKey,
        binance_secret_key: encryptedSecretKey,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (configError) {
      console.error('bot_config update error:', configError);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
