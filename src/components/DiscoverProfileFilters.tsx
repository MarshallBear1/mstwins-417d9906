import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Filter, X } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  age: number | null;
  city: string;
  gender: string | null;
  ms_subtype: string | null;
  avatar_url: string | null;
  about_me_preview: string | null;
  hobbies: string[];
  additional_photos?: string[];
  selected_prompts?: any;
  extended_profile_completed?: boolean;
  symptoms?: string[];
  medications?: string[];
}

interface DiscoverProfileFiltersProps {
  profiles: Profile[];
  onFilterChange: (filteredProfiles: Profile[]) => void;
}

const DiscoverProfileFilters = ({ profiles, onFilterChange }: DiscoverProfileFiltersProps) => {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<string | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Close dropdown when clicking outside or when another overlay opens
  React.useEffect(() => {
    const handleClickOutside = () => {
      setIsFilterDropdownOpen(false);
    };
    
    if (isFilterDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isFilterDropdownOpen]);

  // Get unique filter options from profiles
  const msSubtypes = [...new Set(profiles.map(p => p.ms_subtype).filter(Boolean))];
  const genders = [...new Set(profiles.map(p => p.gender).filter(Boolean))];
  const interests = [...new Set(profiles.flatMap(p => p.hobbies || []))];

  const applyFilter = (type: string, value: string) => {
    setFilterType(type);
    setFilterValue(value);
    setIsFilterDropdownOpen(false);

    const filtered = profiles.filter(profile => {
      switch (type) {
        case 'ms_subtype':
          return profile.ms_subtype === value;
        case 'gender':
          return profile.gender === value;
        case 'interest':
          return profile.hobbies?.includes(value);
        default:
          return true;
      }
    });

    onFilterChange(filtered);
  };

  const clearFilter = () => {
    setFilterType(null);
    setFilterValue(null);
    onFilterChange(profiles);
  };

  return (
    <div className="flex items-center justify-center mb-2 md:mb-6 px-4">
      <div className="flex items-center gap-2">
        <DropdownMenu open={isFilterDropdownOpen} onOpenChange={setIsFilterDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 px-4 text-sm bg-white hover:bg-gray-50 border-2 shadow-lg">
              <Filter className="w-4 h-4 mr-2" />
              {filterType && filterValue 
                ? `${filterType === 'ms_subtype' ? 'MS Type' : filterType === 'gender' ? 'Gender' : 'Interest'}: ${
                    filterType === 'ms_subtype' ? filterValue.toUpperCase() : 
                    filterType === 'gender' ? filterValue.charAt(0).toUpperCase() + filterValue.slice(1) : 
                    filterValue
                  }`
                : 'Filters'
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56 bg-white border shadow-xl max-h-80 overflow-y-auto z-0">
            {/* MS Subtypes */}
            {msSubtypes.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 bg-white border-b">MS Type</div>
                <div className="max-h-32 overflow-y-auto">
                  {msSubtypes.map(subtype => (
                    <DropdownMenuItem
                      key={subtype}
                      onClick={() => applyFilter('ms_subtype', subtype)}
                      className="cursor-pointer"
                    >
                      {subtype?.toUpperCase()}
                    </DropdownMenuItem>
                  ))}
                </div>
              </>
            )}

            {/* Genders */}
            {genders.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t sticky top-0 bg-white">Gender</div>
                <div className="max-h-32 overflow-y-auto">
                  {genders.map(gender => (
                    <DropdownMenuItem
                      key={gender}
                      onClick={() => applyFilter('gender', gender)}
                      className="cursor-pointer"
                    >
                      {gender?.charAt(0).toUpperCase() + gender?.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </div>
              </>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t sticky top-0 bg-white">Interests</div>
                <div className="max-h-40 overflow-y-auto">
                  {interests.map(interest => (
                    <DropdownMenuItem
                      key={interest}
                      onClick={() => applyFilter('interest', interest)}
                      className="cursor-pointer"
                    >
                      {interest}
                    </DropdownMenuItem>
                  ))}
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filter Button */}
        {filterType && filterValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-9 px-2 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default DiscoverProfileFilters;