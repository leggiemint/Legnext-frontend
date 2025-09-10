import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import { getSquareInvoices } from "@/libs/square";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("📄 Square invoices requested by user:", session.user.id);

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // 可选的状态过滤

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("🔍 Fetching real-time invoice data:", {
      userId: user.id,
      email: user.email,
      limit,
      offset,
      statusFilter: status
    });

    // 直接实时从Square API获取invoice数据 - 符合行业标准
    console.log("📡 Fetching invoices directly from Square API (real-time)...");
    
    const invoiceResponse = await getSquareInvoices({
      email: user.email,
      limit,
      cursor: searchParams.get('cursor') || undefined
    });

    // 应用状态过滤
    let filteredInvoices = invoiceResponse.invoices;
    if (status) {
      filteredInvoices = invoiceResponse.invoices.filter(inv => inv.status === status);
    }

    // 计算摘要统计
    const summary = {
      totalInvoices: filteredInvoices.length,
      paidInvoices: filteredInvoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: filteredInvoices.filter(inv => inv.status === 'pending').length,
      totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      lastInvoiceDate: filteredInvoices.length > 0 ? filteredInvoices[0].date : null
    };

    const result = {
      invoices: filteredInvoices,
      pagination: {
        limit,
        cursor: invoiceResponse.cursor,
        hasNext: invoiceResponse.hasNext
      },
      summary
    };

    console.log("✅ Square invoices retrieved successfully (real-time):", {
      totalInvoices: result.invoices.length,
      totalAmount: result.summary.totalAmount,
      dataSource: 'square_api_realtime'
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("❌ Square invoices retrieval failed:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to retrieve invoices",
        details: "Real-time Square API fetch failed. Please try again."
      },
      { status: 500 }
    );
  }
}

// 获取单个发票详情 - 也是实时获取
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    console.log("📄 Single invoice requested (real-time):", {
      userId: session.user.id,
      invoiceId: invoiceId
    });

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 实时获取所有发票，然后找到特定发票
    const invoiceResponse = await getSquareInvoices({
      email: user.email,
      limit: 100 // 获取更多发票来查找特定ID
    });

    const invoice = invoiceResponse.invoices.find(inv => inv.id === invoiceId);

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    console.log("✅ Single invoice retrieved (real-time):", invoice.id);

    return NextResponse.json({ invoice });

  } catch (error: any) {
    console.error("❌ Single invoice retrieval failed:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to retrieve invoice",
        details: "Real-time Square API fetch failed. Please try again."
      },
      { status: 500 }
    );
  }
}