import { useMutation } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { hapticFeedback } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ExternalLink, CheckCircle, Loader2 } from "lucide-react";

const REFERRAL_CHANNEL = "hiddenn_channel";
const CHANNEL_LINK = `https://t.me/${REFERRAL_CHANNEL}`;

export function ReferralVerification() {
  const { user, setUser, language } = useApp();
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/referral/verify-channel", {
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      hapticFeedback("heavy");
      
      if (data.success) {
        if (data.alreadyVerified) {
          toast({
            title: language === "bn" ? "ইতিমধ্যে যাচাই করা হয়েছে" : "Already Verified",
            description: language === "bn" 
              ? "রেফারেল বোনাস আগেই দেওয়া হয়েছে" 
              : "Referral bonus was already credited",
          });
        } else {
          toast({
            title: language === "bn" ? "সফল!" : "Success!",
            description: language === "bn" 
              ? "চ্যানেল যাচাই হয়েছে! আপনার বন্ধু ২ BDT বোনাস পেয়েছে!" 
              : "Channel verified! Your friend earned 2 BDT bonus!",
          });
          
          if (user) {
            setUser({ 
              ...user, 
              referralBonusPending: false,
              referralBonusCredited: true 
            });
          }
        }
      } else if (data.needsJoin) {
        toast({
          title: language === "bn" ? "চ্যানেলে যোগ দিন" : "Join Channel First",
          description: language === "bn" 
            ? "প্রথমে চ্যানেলে যোগ দিন, তারপর আবার যাচাই করুন" 
            : "Please join the channel first, then verify again",
          variant: "destructive",
        });
      } else {
        toast({
          title: language === "bn" ? "ত্রুটি" : "Error",
          description: data.message || "Verification failed",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" 
          ? "যাচাই করতে ব্যর্থ হয়েছে" 
          : "Failed to verify",
        variant: "destructive",
      });
    },
  });

  if (!user?.referralBonusPending) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-sm">
                {language === "bn" ? "রেফারেল বোনাস পেন্ডিং!" : "Referral Bonus Pending!"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "bn" 
                  ? "আমাদের অফিসিয়াল চ্যানেলে যোগ দিন এবং আপনার বন্ধুকে ২ BDT বোনাস দিন!" 
                  : "Join our official channel to give your friend 2 BDT bonus!"}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  hapticFeedback("light");
                  window.open(CHANNEL_LINK, "_blank");
                }}
                data-testid="button-join-channel"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                {language === "bn" ? "চ্যানেলে যোগ দিন" : "Join Channel"}
              </Button>
              
              <Button
                size="sm"
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
                data-testid="button-verify-referral"
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1" />
                )}
                {language === "bn" ? "যাচাই করুন" : "Verify Join"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
