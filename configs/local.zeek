# Zeek configuration for live packet capture
# This file configures Zeek for real-time network monitoring

# Enable all analyzers for comprehensive network analysis
@load base/protocols/conn
@load base/protocols/dns
@load base/protocols/http
@load base/protocols/ssl
@load base/protocols/ftp
@load base/protocols/smtp
@load base/protocols/ssh
@load base/protocols/dhcp
@load base/protocols/ntp
@load base/protocols/icmp

# Load additional security-focused analyzers
@load base/protocols/arp
@load base/protocols/ntlm
@load base/protocols/kerberos
@load base/protocols/rdp

# Load policy scripts for enhanced monitoring
@load base/frameworks/notice
@load base/frameworks/sumstats
@load base/frameworks/software
@load base/frameworks/files

# Configure logging
redef Log::default_rotation_interval = 1 hr;
redef Log::default_mgmt_rotation_interval = 1 hr;

# Enhanced connection logging
redef Conn::log_conn_creation = T;
redef Conn::log_conn_destruction = T;

# File analysis
redef Files::log_rotation_interval = 1 hr;
redef Files::log_rotation_base = "00:00:00";

# Notice framework configuration
redef Notice::ignored_types += { };

# Summary statistics for real-time monitoring
event zeek_init()
{
    # Create summary statistics for connection monitoring
    local r1 = SumStats::Reducer($stream="conn_stats", $apply=set(SumStats::SUM));
    SumStats::create([$name="connection_stats",
                      $epoch=1min,
                      $reducers=set(r1),
                      $epoch_result(ts: time, key: SumStats::Key, result: SumStats::Result) =
                      {
                          local r = result["conn_stats"];
                          Log::write(Log::WRITER_ASCII, [$path="conn_summary", $ts=ts, $msg=fmt("Connections: %d", r$sum)]);
                      }]);
}

# Enhanced connection logging
event connection_established(c: connection)
{
    # Log all established connections for monitoring
    Log::write(Log::WRITER_ASCII, [$path="conn_established", $ts=network_time(), $msg=fmt("Connection established: %s:%d -> %s:%d (%s)", 
        c$id$orig_h, c$id$orig_p, c$id$resp_h, c$id$resp_p, c$conn$proto)]);
}

# DNS monitoring
event dns_request(c: connection, msg: dns_msg, query: string, qtype: count, qclass: count)
{
    Log::write(Log::WRITER_ASCII, [$path="dns_queries", $ts=network_time(), $msg=fmt("DNS Query: %s (%s) from %s", 
        query, qtype, c$id$orig_h)]);
}

# HTTP monitoring
event http_request(c: connection, method: string, original_URI: string, unescaped_URI: string, version: string)
{
    Log::write(Log::WRITER_ASCII, [$path="http_requests", $ts=network_time(), $msg=fmt("HTTP %s: %s from %s", 
        method, original_URI, c$id$orig_h)]);
}

# SSL/TLS monitoring
event ssl_established(c: connection)
{
    Log::write(Log::WRITER_ASCII, [$path="ssl_connections", $ts=network_time(), $msg=fmt("SSL established: %s:%d -> %s:%d", 
        c$id$orig_h, c$id$orig_p, c$id$resp_h, c$id$resp_p)]);
}
