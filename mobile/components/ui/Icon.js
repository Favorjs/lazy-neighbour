import React from 'react';
import {
    ArrowRight, Plus, MapPin, Clock, Sparkles, Star, Utensils, ShoppingBag, House,
    Zap, Hourglass, Footprints, CircleCheck, Wallet, CircleAlert, CircleX, Search,
    Eye, EyeOff, X, MessageCircle, Phone, Navigation, Mail, Lock, User, Bell,
    CreditCard, LogOut, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Radar, ListChecks,
    Send, Check, Camera, Medal, Locate, Bike, Image as ImageIcon, ShieldCheck, Trophy,
    HandCoins, Sun, Moon, Smartphone, Landmark, Trash, Inbox, CircleQuestionMark,
    ArrowDownLeft, ArrowUpRight, BellRing, BookOpen, Banknote,
} from 'lucide-react-native';
import { COLORS } from '../../constants/config';

const ICONS = {
    ArrowRight, Plus, MapPin, Clock, Sparkles, Star, Utensils, ShoppingBag, House,
    Zap, Hourglass, Footprints, CircleCheck, Wallet, CircleAlert, CircleX, Search,
    Eye, EyeOff, X, MessageCircle, Phone, Navigation, Mail, Lock, User, Bell,
    CreditCard, LogOut, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Radar, ListChecks,
    Send, Check, Camera, Medal, Locate, Bike, Image: ImageIcon, ShieldCheck, Trophy,
    HandCoins, Sun, Moon, Smartphone, Landmark, Trash, Inbox, HelpCircle: CircleQuestionMark,
    ArrowDownLeft, ArrowUpRight, BellRing, BookOpen, Banknote,
};

// Lucide outline icon, 2px round stroke. Sizes: 24 tiles and tab bar, 20 buttons and fields, 14 meta lines.
export const Icon = ({ name, size = 20, color = COLORS.ink, strokeWidth = 2, style }) => {
    const Glyph = ICONS[name];
    if (!Glyph) return null;
    return <Glyph size={size} color={color} strokeWidth={strokeWidth} style={style} />;
};

export default Icon;
