import React from 'react';
import { View, Text, ScrollView, TextInput, ImageBackground } from 'react-native';
import { Feather } from '@expo/vector-icons';
const Search = (p: any) => <Feather name="search" {...p} />;
const MapPin  = (p: any) => <Feather name="map-pin" {...p} />;
import GlassPanel from '../../../shared/components/GlassPanel';
import Button from '../../../shared/components/Button';

export default function HomeFeed() {
  return (
    <View className="flex-1 bg-base pt-16">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
        
        {/* Greeting & Location Header */}
        <View className="flex-row justify-between items-end mb-5">
          <View>
            <Text className="text-[13px] font-medium text-[#F4F2EC]/45 mb-1">Good evening</Text>
            <Text className="text-3xl font-semibold tracking-tight text-[#F4F2EC]">Prajwal</Text>
          </View>
          
          <GlassPanel intensity={20} className="px-3 py-2 rounded-[20px] flex-row items-center gap-2">
            <View className="w-1.5 h-1.5 rounded-full bg-accent" />
            <Text className="text-[12px] font-medium text-[#F4F2EC]/70">Bengaluru</Text>
          </GlassPanel>
        </View>

        {/* Floating Search Bar */}
        <GlassPanel intensity={20} className="h-[50px] rounded-[25px] flex-row items-center px-4 gap-3 mb-6">
          <Search size={17} color="rgba(244,242,236,0.5)" strokeWidth={1.8} />
          <TextInput 
            placeholder="Search parties, hosts, vibes…" 
            placeholderTextColor="rgba(244,242,236,0.4)"
            className="flex-1 text-[#F4F2EC] text-[15px]"
          />
        </GlassPanel>

        {/* Featured Hero Card */}
        <View className="relative h-[282px] rounded-[30px] overflow-hidden border border-glass-border mb-6 bg-glass-secondary">
          {/* Use ImageBackground here when connecting real data */}
          <View className="absolute inset-0 bg-gradient-to-b from-transparent to-[#090909]/95" />
          
          <View className="absolute top-4 left-4 px-3 py-1.5 rounded-[9px] bg-accent/90">
            <Text className="text-[10px] font-bold text-[#0A0A0B] tracking-widest">FEATURED · TONIGHT</Text>
          </View>
          
          <View className="absolute bottom-4 left-4 right-4">
            <Text className="text-[22px] font-semibold tracking-tight text-[#F4F2EC] mb-2">
              Rooftop & Records — Indiranagar
            </Text>
            
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-3">
                <Text className="text-[12px] font-medium text-[#F4F2EC]/70">11 PM</Text>
                <View className="w-[3px] h-[3px] rounded-full bg-[#F4F2EC]/40" />
                <Text className="text-[12px] font-medium text-[#F4F2EC]/70">0.6 mi</Text>
                <View className="w-[3px] h-[3px] rounded-full bg-[#F4F2EC]/40" />
                <Text className="text-[12px] font-medium text-[#F4F2EC]/70">87 going</Text>
              </View>
              
              {/* Using our animated spring button */}
              <Button label="RSVP" variant="primary" className="h-9 px-5 w-auto" />
            </View>
          </View>
        </View>

        {/* Trending Rail */}
        <View className="mb-4 flex-row justify-between items-center">
          <Text className="text-[17px] font-semibold tracking-tight text-[#F4F2EC]">Trending tonight</Text>
          <Text className="text-[13px] font-medium text-accent/70">See all</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-4 overflow-visible">
          {/* Trending Card 1 */}
          <View className="w-[172px]">
            <View className="h-[116px] rounded-[22px] overflow-hidden border border-glass-border bg-glass-secondary mb-2" />
            <Text className="text-[14px] font-semibold text-[#F4F2EC]">Loft Sessions</Text>
            <Text className="text-[12px] font-medium text-[#F4F2EC]/45 mt-1">House · 0.9 mi</Text>
          </View>

          {/* Trending Card 2 */}
          <View className="w-[172px] ml-4">
            <View className="h-[116px] rounded-[22px] overflow-hidden border border-glass-border bg-glass-secondary mb-2" />
            <Text className="text-[14px] font-semibold text-[#F4F2EC]">Founders After Dark</Text>
            <Text className="text-[12px] font-medium text-[#F4F2EC]/45 mt-1">Startup · 1.4 mi</Text>
          </View>
        </ScrollView>

      </ScrollView>
    </View>
  );
}