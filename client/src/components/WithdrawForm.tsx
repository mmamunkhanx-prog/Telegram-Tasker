import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { withdrawSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { hapticFeedback } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertCircle } from "lucide-react";
import type { z } from "zod";

type FormData = z.infer<typeof withdrawSchema>;

const paymentMethods = [
  { id: "bkash", name: "bKash" },
  { id: "nagad", name: "Nagad" },
  { id: "usdt", name: "USDT (BEP-20)" },
];

export function WithdrawForm() {
  const { language, user } = useApp();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: 50,
      method: "bkash",
      walletAddress: "",
    },
  });

  const selectedMethod = form.watch("method");
  const amount = form.watch("amount");
  const hasInsufficientBalance = (user?.balance ?? 0) < amount;

  const withdrawMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/transactions/withdraw", {
        ...data,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      hapticFeedback("heavy");
      toast({
        title: t("success", language),
        description: t("withdrawSubmitted", language),
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: "Failed to submit withdrawal request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (hasInsufficientBalance) return;
    hapticFeedback("medium");
    withdrawMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
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
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
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
                      min="50"
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      data-testid="input-withdraw-amount"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">{t("minWithdraw", language)}</p>
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
                      data-testid="input-wallet-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasInsufficientBalance && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {t("insufficientBalance", language)}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={withdrawMutation.isPending || hasInsufficientBalance}
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
