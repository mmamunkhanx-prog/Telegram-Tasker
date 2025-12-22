export type Language = "en" | "bn";

export const translations = {
  en: {
    // Navigation
    home: "Home",
    tasks: "Tasks",
    createNav: "Create",
    profile: "Profile",
    
    // Home
    mainBalance: "Main Balance",
    topEarners: "Top Earners",
    viewAll: "View All",
    
    // Tasks
    availableTasks: "Available Tasks",
    joinChannel: "Join Channel",
    start: "Start",
    verify: "Verify",
    verifying: "Verifying...",
    completed: "Completed",
    reward: "Reward",
    noTasks: "No tasks available",
    taskCompleted: "Task completed! Reward added.",
    taskFailed: "Verification failed. Please join the channel first.",
    
    // Create Task
    createTask: "Create Task",
    taskTitle: "Task Title",
    taskTitleBn: "Task Title (Bangla)",
    channelUsername: "Channel Username",
    channelLink: "Channel Link",
    rewardPerMember: "Reward per Member (BDT)",
    totalBudget: "Total Budget (BDT)",
    minReward: "Minimum 0.5 BDT per member",
    estimatedMembers: "Estimated Members",
    create: "Create Task",
    creating: "Creating...",
    insufficientBalance: "Insufficient balance",
    taskCreated: "Task created successfully!",
    
    // Profile
    referralLink: "Referral Link",
    copy: "Copy",
    copied: "Copied!",
    deposit: "Deposit",
    withdraw: "Withdraw",
    history: "History",
    
    // Deposit
    depositFunds: "Deposit Funds",
    selectMethod: "Select Method",
    amount: "Amount (BDT)",
    transactionId: "Transaction ID",
    sendTo: "Send to",
    usdtAddress: "USDT (BEP-20) Address",
    submitDeposit: "Submit Deposit",
    submitting: "Submitting...",
    depositSubmitted: "Deposit request submitted!",
    
    // Withdraw
    withdrawFunds: "Withdraw Funds",
    walletNumber: "Wallet Number",
    walletAddress: "Wallet Address",
    minWithdraw: "Minimum withdrawal: 50 BDT",
    submitWithdraw: "Submit Withdrawal",
    withdrawSubmitted: "Withdrawal request submitted!",
    
    // History
    transactionHistory: "Transaction History",
    noTransactions: "No transactions yet",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    
    // Admin
    adminPanel: "Admin Panel",
    statistics: "Statistics",
    totalUsers: "Total Users",
    totalDeposits: "Total Deposits",
    totalWithdrawals: "Total Withdrawals",
    pendingDeposits: "Pending Deposits",
    pendingWithdrawals: "Pending Withdrawals",
    activeTasks: "Active Tasks",
    pendingRequests: "Pending Requests",
    approve: "Approve",
    reject: "Reject",
    
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    bdt: "BDT",
  },
  bn: {
    // Navigation
    home: "হোম",
    tasks: "টাস্ক",
    createNav: "তৈরি",
    profile: "প্রোফাইল",
    
    // Home
    mainBalance: "মূল ব্যালেন্স",
    topEarners: "শীর্ষ উপার্জনকারী",
    viewAll: "সব দেখুন",
    
    // Tasks
    availableTasks: "উপলব্ধ টাস্ক",
    joinChannel: "চ্যানেলে যোগ দিন",
    start: "শুরু",
    verify: "যাচাই",
    verifying: "যাচাই হচ্ছে...",
    completed: "সম্পন্ন",
    reward: "পুরস্কার",
    noTasks: "কোন টাস্ক নেই",
    taskCompleted: "টাস্ক সম্পন্ন! পুরস্কার যোগ হয়েছে।",
    taskFailed: "যাচাই ব্যর্থ। অনুগ্রহ করে প্রথমে চ্যানেলে যোগ দিন।",
    
    // Create Task
    createTask: "টাস্ক তৈরি",
    taskTitle: "টাস্ক শিরোনাম",
    taskTitleBn: "টাস্ক শিরোনাম (বাংলা)",
    channelUsername: "চ্যানেল ইউজারনেম",
    channelLink: "চ্যানেল লিংক",
    rewardPerMember: "প্রতি সদস্য পুরস্কার (টাকা)",
    totalBudget: "মোট বাজেট (টাকা)",
    minReward: "সর্বনিম্ন ০.৫ টাকা প্রতি সদস্য",
    estimatedMembers: "আনুমানিক সদস্য",
    create: "টাস্ক তৈরি করুন",
    creating: "তৈরি হচ্ছে...",
    insufficientBalance: "অপর্যাপ্ত ব্যালেন্স",
    taskCreated: "টাস্ক সফলভাবে তৈরি হয়েছে!",
    
    // Profile
    referralLink: "রেফারেল লিংক",
    copy: "কপি",
    copied: "কপি হয়েছে!",
    deposit: "জমা",
    withdraw: "উত্তোলন",
    history: "ইতিহাস",
    
    // Deposit
    depositFunds: "টাকা জমা দিন",
    selectMethod: "পদ্ধতি নির্বাচন",
    amount: "পরিমাণ (টাকা)",
    transactionId: "ট্রানজেকশন আইডি",
    sendTo: "পাঠান",
    usdtAddress: "USDT (BEP-20) ঠিকানা",
    submitDeposit: "জমা জমা দিন",
    submitting: "জমা হচ্ছে...",
    depositSubmitted: "জমা অনুরোধ জমা হয়েছে!",
    
    // Withdraw
    withdrawFunds: "টাকা উত্তোলন",
    walletNumber: "ওয়ালেট নম্বর",
    walletAddress: "ওয়ালেট ঠিকানা",
    minWithdraw: "সর্বনিম্ন উত্তোলন: ৫০ টাকা",
    submitWithdraw: "উত্তোলন জমা দিন",
    withdrawSubmitted: "উত্তোলন অনুরোধ জমা হয়েছে!",
    
    // History
    transactionHistory: "লেনদেন ইতিহাস",
    noTransactions: "এখনো কোন লেনদেন নেই",
    pending: "অপেক্ষমাণ",
    approved: "অনুমোদিত",
    rejected: "প্রত্যাখ্যাত",
    
    // Admin
    adminPanel: "অ্যাডমিন প্যানেল",
    statistics: "পরিসংখ্যান",
    totalUsers: "মোট ব্যবহারকারী",
    totalDeposits: "মোট জমা",
    totalWithdrawals: "মোট উত্তোলন",
    pendingDeposits: "অপেক্ষমাণ জমা",
    pendingWithdrawals: "অপেক্ষমাণ উত্তোলন",
    activeTasks: "সক্রিয় টাস্ক",
    pendingRequests: "অপেক্ষমাণ অনুরোধ",
    approve: "অনুমোদন",
    reject: "প্রত্যাখ্যান",
    
    // Common
    loading: "লোড হচ্ছে...",
    error: "ত্রুটি",
    success: "সফল",
    cancel: "বাতিল",
    save: "সংরক্ষণ",
    bdt: "৳",
  },
} as const;

export function t(key: keyof typeof translations.en, lang: Language): string {
  return translations[lang][key] || translations.en[key] || key;
}
