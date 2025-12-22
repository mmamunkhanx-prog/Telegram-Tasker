import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { t } from "@/lib/i18n";
import { depositSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { hapticFeedback } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Copy, Check } from "lucide-react";
import type { z } from "zod";

type FormData = z.infer<typeof depositSchema>;

const paymentMethods = [
  { id: "bkash", name: "bKash", number: "01320340667" },
  { id: "nagad", name: "Nagad", number: "01320340667" },
  { id: "usdt", name: "USDT (BEP-20)", address: "0x96E5...7ED789" },
];

const USDT_ADDRESS = "0x96E5b80549023912E2D4B07AcE3efD8c5f7ED789";

// Conversion rate: 1 USDT = 125 BDT
const USDT_TO_BDT_RATE = 125;

export function DepositForm() {
  const { language, user } = useApp();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 100,
      method: "bkash",
      transactionId: "",
    },
  });

  const selectedMethod = form.watch("method");
  const watchedAmount = form.watch("amount");

  const depositMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/transactions/deposit", {
        ...data,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      hapticFeedback("heavy");
      toast({
        title: t("success", language),
        description: t("depositSubmitted", language),
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: "Failed to submit deposit request",
        variant: "destructive",
      });
    },
  });

  const handleCopyAddress = async (text: string) => {
    hapticFeedback("light");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = (data: FormData) => {
    hapticFeedback("medium");
    depositMutation.mutate(data);
  };

  const currentMethod = paymentMethods.find((m) => m.id === selectedMethod);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("depositFunds", language)}</CardTitle>
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
                            id={method.id}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={method.id}
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 transition-all"
                            data-testid={`radio-${method.id}`}
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

            {currentMethod && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                <div className="text-sm text-muted-foreground">{t("sendTo", language)}</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-background px-2 py-1 rounded border truncate">
                    {selectedMethod === "usdt" ? USDT_ADDRESS : currentMethod.number}
                  </code>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      handleCopyAddress(
                        selectedMethod === "usdt" ? USDT_ADDRESS : currentMethod.number!
                      )
                    }
                    data-testid="button-copy-address"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amount", language)} (BDT)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="10"
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      data-testid="input-deposit-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedMethod === "usdt" && watchedAmount > 0 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20" data-testid="usdt-conversion">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {language === "bn" ? "আপনাকে পাঠাতে হবে" : "You need to pay"}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {(watchedAmount / USDT_TO_BDT_RATE).toFixed(2)} USDT
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {language === "bn" ? "রেট: ১ USDT = ১২৫ BDT" : "Rate: 1 USDT = 125 BDT"}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactionId", language)}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="TXN123456789"
                      data-testid="input-transaction-id"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={depositMutation.isPending}
              data-testid="button-submit-deposit"
            >
              {depositMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("submitting", language)}
                </>
              ) : (
                t("submitDeposit", language)
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
