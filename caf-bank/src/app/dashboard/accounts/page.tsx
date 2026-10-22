import { currentUser } from "@/lib/auth";
import { Account } from "@/lib/models";
import { AccountCards } from "@/components/account-cards";
export default async function AccountsPage(){const user=await currentUser();const accounts=await Account.find({userId:user._id}).lean();return <><span className="eyebrow">Accounts</span><h1 className="text-3xl font-bold mt-1 mb-8">Your accounts</h1><AccountCards accounts={accounts.map(a=>({_id:String(a._id),name:a.name,currency:a.currency,availableBalance:a.availableBalance,ledgerBalance:a.ledgerBalance,status:a.status}))}/></>}
