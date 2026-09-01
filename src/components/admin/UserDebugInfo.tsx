
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const UserDebugInfo = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
      console.log('All users in profiles table:', data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCreateUser = async () => {
    try {
      console.log('Testing user creation for kristofferswik@gmail.com...');
      
      const { data, error } = await supabase.rpc('create_organization_member', {
        user_email: 'kristofferswik@gmail.com',
        user_password: '123456',
        user_name: 'Kristoffer Svik',
        organization_id: user?.organization_id
      });

      if (error) {
        console.error('User creation error:', error);
      } else {
        console.log('User creation result:', data);
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error in user creation:', error);
    }
  };

  useEffect(() => {
    if (user?.organization_id) {
      fetchUsers();
    }
  }, [user?.organization_id]);

  if (!user || user.organization_id === undefined) {
    return <div>Du må være logget inn som admin for å se denne informasjonen.</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Bruker Debug Informasjon</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={fetchUsers} disabled={loading}>
            {loading ? 'Laster...' : 'Oppdater brukerliste'}
          </Button>
          <Button onClick={testCreateUser} variant="outline">
            Test opprett kristofferswik@gmail.com
          </Button>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Alle brukere i systemet:</h3>
          {users.length === 0 ? (
            <p>Ingen brukere funnet</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="p-3 border rounded-lg">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Navn:</strong> {user.name}</div>
                  <div><strong>Rolle:</strong> {user.role}</div>
                  <div><strong>Organisasjon ID:</strong> {user.organization_id}</div>
                  <div><strong>Opprettet:</strong> {new Date(user.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-semibold">Debug informasjon:</h4>
          <p>Din bruker ID: {user.id}</p>
          <p>Din organisasjon ID: {user.organization_id}</p>
          <p>Sjekk konsollen for detaljert logging</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserDebugInfo;
