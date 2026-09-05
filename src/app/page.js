import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (token) {
    const payload = await verifyJWT(token);
    if (payload) {
      redirect('/dashboard');
    }
  }
  
  redirect('/login');
}
