"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getContacts, Contact } from "@/lib/api/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  Plus,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Briefcase,
  Tag
} from "lucide-react";

// Notion-like Table Styles
const tableStyles = `
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
  
  .notion-table {
    font-family: "Inter", sans-serif;
    border-spacing: 0;
    border-top: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    width: 100%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    table-layout: fixed;
  }
  
  .notion-th {
    color: #9e9e9e;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    border-bottom: 1px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
    background-color: #fafafa;
    position: relative;
    padding: 0;
    white-space: nowrap;
    margin: 0;
    text-align: left;
    vertical-align: middle;
  }
  
  .notion-th:hover {
    background-color: #f5f5f5;
  }
  
  .notion-th:last-child {
    border-right: 0;
  }
  
  .notion-th-content {
    overflow-x: hidden;
    text-overflow: ellipsis;
    padding: 0.75rem 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 40px;
    width: 100%;
    padding-right: 20px;
  }
  
  .notion-td {
    color: #424242;
    border-bottom: 1px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
    position: relative;
    margin: 0;
    padding: 0.5rem;
    text-align: left;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .notion-td:last-child {
    border-right: 0;
  }
  
  .notion-tr:hover .notion-td {
    background-color: #f8f9fa;
  }
  
  .notion-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .notion-icon {
    width: 14px;
    height: 14px;
    margin-right: 6px;
    opacity: 0.6;
  }
  
  .sort-icon {
    width: 12px;
    height: 12px;
    opacity: 0.5;
  }
  
  .sort-icon.active {
    opacity: 1;
    color: #2563eb;
  }

  .resizer {
    display: inline-block;
    background: transparent;
    width: 8px;
    height: 100%;
    position: absolute;
    right: 0;
    top: 0;
    transform: translateX(50%);
    z-index: 1;
    cursor: col-resize;
    touch-action: none;
  }

  .resizer:hover {
    background-color: #8ecae6;
  }

  .resizer.isResizing {
    background-color: #2563eb;
  }

  .noselect {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
`;

export default function ContactsPage() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("firstname");
  const [sortOrder, setSortOrder] = useState("asc");
  const [limit, setLimit] = useState(50);
  
  // Column widths state
  const [columnWidths, setColumnWidths] = useState({
    firstname: 150,
    lastname: 150,
    email: 250,
    phone: 150,
    company: 200,
    jobtitle: 180,
    lifecyclestage: 120,
    city: 150
  });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const fetchContacts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      console.log('🔥 Fetching contacts with:', { page, limit, search, sortField, sortOrder }); // Debug log
      const response = await getContacts(
        token,
        page,
        limit,
        search || undefined,
        sortField,
        sortOrder
      );
      setContacts(response.contacts);
      setTotalPages(response.total_pages);
      setTotal(response.total);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des contacts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, search, sortField, sortOrder]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSort = (field: string) => {
    console.log('🎯 Sort clicked:', field);
    
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
    
    // Ne pas dupliquer l'appel API ici - laisser useEffect/fetchContacts s'en charger
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const getLifecycleStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      lead: "bg-blue-50 text-blue-700 border-blue-200",
      customer: "bg-green-50 text-green-700 border-green-200",
      subscriber: "bg-purple-50 text-purple-700 border-purple-200",
      opportunity: "bg-orange-50 text-orange-700 border-orange-200",
      other: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return colors[stage?.toLowerCase()] || colors.other;
  };

  const getSortIcon = (field: string) => {
    const isActive = sortField === field;
    const className = `sort-icon ${isActive ? 'active' : ''}`;
    
    if (!isActive) return <ArrowUpDown className={className} />;
    return sortOrder === "asc" ? 
      <ArrowUp className={className} /> : 
      <ArrowDown className={className} />;
  };

  const columns = [
    { key: "firstname", label: "First Name", icon: User },
    { key: "lastname", label: "Last Name", icon: User },
    { key: "email", label: "Email", icon: Mail },
    { key: "phone", label: "Phone", icon: Phone },
    { key: "company", label: "Company", icon: Building },
    { key: "jobtitle", label: "Job Title", icon: Briefcase },
    { key: "lifecyclestage", label: "Stage", icon: Tag },
    { key: "city", label: "City", icon: MapPin }
  ];

  // Resizer functions
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(columnKey);
    
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey as keyof typeof columnWidths];

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(80, startWidth + diff); // Minimum width of 80px
      
      setColumnWidths(prev => ({
        ...prev,
        [columnKey]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 font-medium">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <Button onClick={fetchContacts} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{tableStyles}</style>
      <div className={`min-h-screen bg-gray-50 ${isResizing ? 'noselect' : ''}`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contacts Database</h1>
              <p className="text-gray-600 text-sm mt-1">
                {total.toLocaleString()} contacts • Page {page} of {totalPages}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
              <SelectTrigger className="w-40 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Container */}
        <div className="px-6 py-6">
          <div className="overflow-auto">
            <table ref={tableRef} className="notion-table">
              {/* Header */}
              <thead>
                <tr className="notion-tr">
                  {columns.map((column) => {
                    const Icon = column.icon;
                    const width = columnWidths[column.key as keyof typeof columnWidths];
                    
                    return (
                      <th
                        key={column.key}
                        className="notion-th"
                        style={{ width: `${width}px` }}
                      >
                        <button
                          onClick={() => handleSort(column.key)}
                          className="notion-th-content w-full text-left"
                        >
                          <Icon className="notion-icon" />
                          <span className="font-medium">{column.label}</span>
                          <div className="ml-auto">
                            {getSortIcon(column.key)}
                          </div>
                        </button>
                        
                        {/* Resizer */}
                        <div
                          className={`resizer ${resizingColumn === column.key ? 'isResizing' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, column.key)}
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="notion-tr">
                    <td className="notion-td" style={{ width: `${columnWidths.firstname}px` }}>
                      {contact.firstname || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.lastname}px` }}>
                      {contact.lastname || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.email}px` }}>
                      {contact.email ? (
                        <a 
                          href={`mailto:${contact.email}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.phone}px` }}>
                      {contact.phone || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.company}px` }}>
                      {contact.company || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.jobtitle}px` }}>
                      {contact.jobtitle || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.lifecyclestage}px` }}>
                      {contact.lifecyclestage ? (
                        <span className={`notion-tag ${getLifecycleStageColor(contact.lifecyclestage)}`}>
                          {contact.lifecyclestage}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.city}px` }}>
                      {contact.city || <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer/Pagination */}
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total.toLocaleString()} contacts
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 text-sm ${
                        pageNum === page 
                          ? "bg-blue-600 text-white hover:bg-blue-700" 
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 