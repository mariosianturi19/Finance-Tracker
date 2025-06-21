// lib/wallets.ts
import { supabase } from './supabase';
import { Wallet, WalletType, WalletWithBalance } from './types';

export async function getWallets(): Promise<WalletWithBalance[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .rpc('get_user_wallets_with_balance', { user_uuid: user.id });

  if (error) throw error;
  return data || [];
}

export async function createWallet(wallet: {
  name: string;
  type: WalletType;
  initial_balance: number;
}): Promise<Wallet> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('wallets')
    .insert({
      user_id: user.id,
      name: wallet.name,
      type: wallet.type,
      initial_balance: wallet.initial_balance,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWallet(id: string, updates: {
  name?: string;
  type?: WalletType;
  initial_balance?: number;
}): Promise<Wallet> {
  const { data, error } = await supabase
    .from('wallets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWallet(id: string): Promise<void> {
  const { error } = await supabase
    .from('wallets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getWalletBalance(walletId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_wallet_balance', { wallet_uuid: walletId });

  if (error) throw error;
  return data || 0;
}

export function getWalletTypeIcon(type: WalletType): string {
  switch (type) {
    case 'bank':
      return '🏦';
    case 'ewallet':
      return '💳';
    case 'cash':
      return '💵';
    default:
      return '💰';
  }
}

export function getWalletTypeLabel(type: WalletType): string {
  switch (type) {
    case 'bank':
      return 'Bank';
    case 'ewallet':
      return 'E-Wallet';
    case 'cash':
      return 'Cash';
    default:
      return 'Unknown';
  }
}