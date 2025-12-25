import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { hapticFeedback } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";
import type { AppSettings } from "@shared/schema";

const paymentMethods = [
  { id: "bkash", name: "bKash" },
  { id: "nagad", name: "Nagad" },
  { id: "usdt", name: "USDT (BEP-20)" },
];

export function WithdrawForm() {
  const { language, user } = useApp();
  const { toast } = useToast();

  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const minWithdraw = settings?.minWithdrawAmount ?? 50;

  const withdrawFormSchema = z.object({
    amount: z.number().min(minWithdraw, `Minimum withdraw is ${minWithdraw} BDT`),
    method: z.enum(["bkash", "nagad", "usdt"]),
    walletAddress: z.string().min(1, "Wallet address is required"),
  });

  type FormData = z.infer<typeof withdrawFormSchema>;

  const form = useForm<FormData>({
    defaultValues: {
      amount: minWithdraw,
      method: "bkash",
      walletAddress: "",
    },
  });

  const selectedMethod = form.watch("method");
  const amount = form.watch("amount");
  const hasInsufficientBalance = (user?.balance ?? 0) < amount;
  const isBelowMinimum = amount < minWithdraw;

  const withdrawMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/transactions/withdraw", {
        ...data,
        userId: user?.id,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit withdrawal");
      }
      return response.json();
    },
    onSuccess: () => {
      hapticFeedback("heavy");
      toast({
        title: t("success", language),
        description: t("withdrawSubmitted", language),
      });
      form.reset({ amount: minWithdraw, method: "bkash", walletAddress: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("error", language),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (hasInsufficientBalance || isBelowMinimum) return;
    hapticFeedback("medium");
    withdrawMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{t("withdrawFunds", language)}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("selectMethod", language)}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-3 gap-2"
                    >
                      {paymentMethods.map((method) => (
                        <div key={method.id}>
                          <RadioGroupItem
                            value={method.id}
                            id={`withdraw-${method.id}`}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={`withdraw-${method.id}`}
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-card p-3 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
                            data-testid={`radio-withdraw-${method.id}`}
                          >
                            <span className="text-sm font-medium">{method.name}</span>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amount", language)}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={minWithdraw}
                      className="bg-muted/50"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-withdraw-amount"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" 
                      ? `সর্বনিম্ন উত্তোলন ${minWithdraw} BDT` 
                      : `Minimum withdraw: ${minWithdraw} BDT`}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {selectedMethod === "usdt"
                      ? t("walletAddress", language)
                      : t("walletNumber", language)}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={
                        selectedMethod === "usdt"
                          ? "0x..."
                          : "01XXXXXXXXX"
                      }
                      className="bg-muted/50"
                      data-testid="input-wallet-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isBelowMinimum && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {language === "bn" 
                  ? `সর্বনিম্ন উত্তোলন ${minWithdraw} BDT` 
                  : `Minimum withdraw amount is ${minWithdraw} BDT`}
              </div>
            )}

            {hasInsufficientBalance && !isBelowMinimum && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {t("insufficientBalance", language)}
              </div>
            )}

            <Button
              type="submit"
              className="w-full shadow-md"
              disabled={withdrawMutation.isPending || hasInsufficientBalance || isBelowMinimum}
              data-testid="button-submit-withdraw"
            >
              {withdrawMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("submitting", language)}
                </>
              ) : (
                t("submitWithdraw", language)
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
