import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { MailCheck } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("guest");
  const [loading, setLoading] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, fullName, role);
      setShowVerifyDialog(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Create Account</CardTitle>
            <CardDescription>Join Roomzy as a guest or host</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>I want to</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("guest")}
                    className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors ${
                      role === "guest" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    🏖️ Book stays
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("host")}
                    className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors ${
                      role === "host" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    🏠 Host guests
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>

        {/* Email Verification Dialog */}
        <Dialog open={showVerifyDialog} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader className="items-center text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-7 w-7 text-primary" />
              </div>
              <DialogTitle className="text-xl">Verify Your Email</DialogTitle>
              <DialogDescription className="text-center">
                We've sent a verification link to <span className="font-medium text-foreground">{email}</span>.
                Please check your inbox and click the link to activate your account before logging in.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button onClick={() => { setShowVerifyDialog(false); navigate("/login"); }}>
                Go to Login
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Register;
