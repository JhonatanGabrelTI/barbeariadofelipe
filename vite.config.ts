import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const PRODUCTION_SUPABASE_PROJECT = 'digndytmkfsgysthfznd'

// Impede que uma atualizacao seja publicada sem banco ou apontando para outro
// projeto. O banco guarda a agenda; trocar a URL equivale a esconder os dados.
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), '')
    const supabaseUrl = env.VITE_SUPABASE_URL?.trim()
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim()

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Deploy bloqueado: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar configuradas.',
      )
    }

    let projectRef = ''
    try {
      projectRef = new URL(supabaseUrl).hostname.split('.')[0]
    } catch {
      throw new Error('Deploy bloqueado: VITE_SUPABASE_URL nao e uma URL valida.')
    }

    if (projectRef !== PRODUCTION_SUPABASE_PROJECT) {
      throw new Error(
        `Deploy bloqueado: o banco configurado (${projectRef || 'desconhecido'}) nao e o banco oficial (${PRODUCTION_SUPABASE_PROJECT}).`,
      )
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
