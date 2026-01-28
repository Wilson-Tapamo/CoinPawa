"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Mail,
  Calendar,
  Wallet,
  Ban,
  UserCheck,
  Clock,
  TrendingUp,
  DollarSign,
  Gamepad2,
  AlertCircle,
  Edit,
  Save,
  X,
  Loader2,
  Plus
} from "lucide-react";
import { cn, formatToUSD } from "@/lib/utils";
import Link from "next/link";

interface UserDetails {
  id: string;
  username: string;
  email: string | null;
  role: string;
  isBanned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  isEmailVerified: boolean;
  gamesPlayed: number;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  wallet: {
    balanceSats: string;
    totalDepositedSats: string;
    totalWageredSats: string;
  } | null;
  transactions: Array<{
    id: string;
    type: string;
    amountSats: string;
    status: string;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    note: string;
    authorName: string;
    isImportant: boolean;
    createdAt: string;
  }>;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isImportant, setIsImportant] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setEditedEmail(data.user.email || "");
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBan = async () => {
    const reason = prompt("Raison du ban:");
    if (!reason) return;

    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason }),
      });

      if (res.ok) {
        alert("Utilisateur banni");
        fetchUserDetails();
      }
    } catch (error) {
      alert("Erreur");
    }
  };

  const handleUnban = async () => {
    try {
      const res = await fetch("/api/admin/users/unban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        alert("Utilisateur débanni");
        fetchUserDetails();
      }
    } catch (error) {
      alert("Erreur");
    }
  };

  const handleSaveEmail = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editedEmail }),
      });

      if (res.ok) {
        alert("Email mis à jour");
        setIsEditing(false);
        fetchUserDetails();
      }
    } catch (error) {
      alert("Erreur");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote, isImportant }),
      });

      if (res.ok) {
        setNewNote("");
        setIsImportant(false);
        fetchUserDetails();
      }
    } catch (error) {
      alert("Erreur");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-text-tertiary">Utilisateur introuvable</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
              {user.username}
              {user.isBanned && (
                <span className="px-3 py-1 bg-accent-rose/10 text-accent-rose rounded-lg text-sm font-bold">
                  Banned
                </span>
              )}
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {user.isBanned ? (
            <button
              onClick={handleUnban}
              className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success border border-success/20 rounded-xl font-bold text-sm hover:bg-success/20 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              Unban User
            </button>
          ) : (
            <button
              onClick={handleBan}
              className="flex items-center gap-2 px-4 py-2 bg-accent-rose/10 text-accent-rose border border-accent-rose/20 rounded-xl font-bold text-sm hover:bg-accent-rose/20 transition-colors"
            >
              <Ban className="w-4 h-4" />
              Ban User
            </button>
          )}
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-bold text-text-tertiary uppercase">Balance</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">
            {formatToUSD(Number(user.wallet?.balanceSats || 0) / 100_000_000)}
          </p>
        </div>

        <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-success/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <span className="text-xs font-bold text-text-tertiary uppercase">Deposited</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">
            {formatToUSD(Number(user.wallet?.totalDepositedSats || 0) / 100_000_000)}
          </p>
        </div>

        <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-accent-violet/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-accent-violet" />
            </div>
            <span className="text-xs font-bold text-text-tertiary uppercase">Wagered</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">
            {formatToUSD(Number(user.wallet?.totalWageredSats || 0) / 100_000_000)}
          </p>
        </div>

        <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-accent-cyan/10 rounded-xl">
              <Gamepad2 className="w-6 h-6 text-accent-cyan" />
            </div>
            <span className="text-xs font-bold text-text-tertiary uppercase">Games Played</span>
          </div>
          <p className="text-2xl font-display font-bold text-white">
            {user.gamesPlayed}
          </p>
        </div>
      </div>

      {/* USER INFO & BAN INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white mb-4">User Information</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm text-text-secondary">Email</span>
              </div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={editedEmail}
                    onChange={(e) => setEditedEmail(e.target.value)}
                    className="bg-background-secondary border border-white/10 rounded px-2 py-1 text-sm text-white"
                  />
                  <button onClick={handleSaveEmail} className="text-success">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsEditing(false)} className="text-accent-rose">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {user.email || "No email"}
                  </span>
                  <button onClick={() => setIsEditing(true)} className="text-text-tertiary hover:text-white">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm text-text-secondary">Role</span>
              </div>
              <span className={cn(
                "px-2 py-1 rounded text-xs font-bold",
                user.role === "ADMIN" && "bg-primary/10 text-primary",
                user.role === "USER" && "bg-white/5 text-text-secondary"
              )}>
                {user.role}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm text-text-secondary">Joined</span>
              </div>
              <span className="text-sm font-bold text-white">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm text-text-secondary">Last Login</span>
              </div>
              <span className="text-sm font-bold text-white">
                {user.lastLoginAt 
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "Never"
                }
              </span>
            </div>
          </div>
        </div>

        {/* Ban Info */}
        {user.isBanned && (
          <div className="bg-accent-rose/10 rounded-xl p-6 border border-accent-rose/20">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-accent-rose" />
              <h3 className="text-lg font-bold text-accent-rose">Ban Information</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-accent-rose/70 mb-1">Banned At</p>
                <p className="text-sm font-bold text-white">
                  {user.bannedAt && new Date(user.bannedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-accent-rose/70 mb-1">Reason</p>
                <p className="text-sm font-bold text-white">
                  {user.banReason || "No reason provided"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes Section (if not banned, takes full width) */}
        {!user.isBanned && (
          <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4">Admin Notes</h3>
            
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {user.notes.length === 0 ? (
                <p className="text-sm text-text-tertiary text-center py-4">No notes yet</p>
              ) : (
                user.notes.map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      note.isImportant
                        ? "bg-accent-rose/10 border-accent-rose/20"
                        : "bg-background-secondary border-white/5"
                    )}
                  >
                    <p className="text-sm text-white mb-2">{note.note}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-tertiary">
                        By {note.authorName}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full bg-background-secondary border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-text-tertiary focus:outline-none focus:border-primary/50 resize-none"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="rounded"
                  />
                  Mark as important
                </label>
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="bg-[#1A1D26] rounded-xl p-6 border border-white/5">
        <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
        
        {user.transactions.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {user.transactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-background-secondary/50 rounded-lg border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      tx.type === "DEPOSIT" && "bg-success/10 text-success",
                      tx.type === "WITHDRAW" && "bg-accent-rose/10 text-accent-rose",
                      tx.type === "BET" && "bg-accent-violet/10 text-accent-violet",
                      tx.type === "WIN" && "bg-primary/10 text-primary"
                    )}
                  >
                    {tx.type.substring(0, 1)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white capitalize">
                      {tx.type.toLowerCase()}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold font-mono",
                    (tx.type === "DEPOSIT" || tx.type === "WIN") && "text-success",
                    (tx.type === "WITHDRAW" || tx.type === "BET") && "text-accent-rose"
                  )}>
                    {(tx.type === "DEPOSIT" || tx.type === "WIN") && "+"}
                    {(tx.type === "WITHDRAW" || tx.type === "BET") && "-"}
                    {formatToUSD(Number(tx.amountSats) / 100_000_000)}
                  </p>
                  <p className={cn(
                    "text-xs font-bold",
                    tx.status === "COMPLETED" && "text-success",
                    tx.status === "PENDING" && "text-primary",
                    tx.status === "FAILED" && "text-accent-rose"
                  )}>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
