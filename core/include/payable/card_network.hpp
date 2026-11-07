// PayAble core - card network model.
//
// Each payment network is an object that knows its own IIN (issuer
// identification number) prefix ranges, allowed PAN lengths and CVV length.
// New networks are added by subclassing PrefixRangeNetwork, without touching
// the validator (open/closed principle).
#pragma once

#include <cstdint>
#include <memory>
#include <string>
#include <string_view>
#include <vector>

namespace payable {

// Abstract interface every network implements.
class CardNetwork {
public:
    virtual ~CardNetwork() = default;

    virtual std::string id() const = 0;            // stable id, e.g. "visa"
    virtual std::string displayName() const = 0;   // human label, e.g. "Visa"
    virtual bool matchesPrefix(std::string_view digits) const = 0;
    virtual bool isValidLength(std::size_t length) const = 0;
    virtual std::size_t cvvLength() const = 0;
};

// An inclusive IIN range compared on the first `width` digits of the PAN.
struct IinRange {
    std::uint32_t low;
    std::uint32_t high;
    std::uint8_t width;
};

// Shared implementation for networks defined by IIN ranges + lengths.
class PrefixRangeNetwork : public CardNetwork {
public:
    PrefixRangeNetwork(std::string id, std::string displayName,
                       std::vector<IinRange> ranges,
                       std::vector<std::size_t> lengths,
                       std::size_t cvvLength);

    std::string id() const override { return id_; }
    std::string displayName() const override { return displayName_; }
    bool matchesPrefix(std::string_view digits) const override;
    bool isValidLength(std::size_t length) const override;
    std::size_t cvvLength() const override { return cvvLength_; }

private:
    std::string id_;
    std::string displayName_;
    std::vector<IinRange> ranges_;
    std::vector<std::size_t> lengths_;
    std::size_t cvvLength_;
};

class VisaNetwork final : public PrefixRangeNetwork { public: VisaNetwork(); };
class MastercardNetwork final : public PrefixRangeNetwork { public: MastercardNetwork(); };
class AmexNetwork final : public PrefixRangeNetwork { public: AmexNetwork(); };
class RuPayNetwork final : public PrefixRangeNetwork { public: RuPayNetwork(); };
class DiscoverNetwork final : public PrefixRangeNetwork { public: DiscoverNetwork(); };

// Ordered registry: more specific ranges (RuPay) are checked before broader
// overlapping ones (Discover's 65xxxx block).
class NetworkRegistry {
public:
    static NetworkRegistry withDefaults();

    void add(std::unique_ptr<CardNetwork> network);
    const CardNetwork* detect(std::string_view digits) const;
    const CardNetwork* byId(std::string_view id) const;

private:
    std::vector<std::unique_ptr<CardNetwork>> networks_;
};

}  // namespace payable
