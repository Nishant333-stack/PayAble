#include "payable/card_network.hpp"

#include <algorithm>

namespace payable {

PrefixRangeNetwork::PrefixRangeNetwork(std::string id, std::string displayName,
                                       std::vector<IinRange> ranges,
                                       std::vector<std::size_t> lengths,
                                       std::size_t cvvLength)
    : id_(std::move(id)),
      displayName_(std::move(displayName)),
      ranges_(std::move(ranges)),
      lengths_(std::move(lengths)),
      cvvLength_(cvvLength) {}

bool PrefixRangeNetwork::matchesPrefix(std::string_view digits) const {
    for (const auto& r : ranges_) {
        if (digits.size() < r.width) continue;
        std::uint32_t prefix = 0;
        for (std::size_t i = 0; i < r.width; ++i) {
            prefix = prefix * 10 + static_cast<std::uint32_t>(digits[i] - '0');
        }
        if (prefix >= r.low && prefix <= r.high) return true;
    }
    return false;
}

bool PrefixRangeNetwork::isValidLength(std::size_t length) const {
    return std::find(lengths_.begin(), lengths_.end(), length) != lengths_.end();
}

VisaNetwork::VisaNetwork()
    : PrefixRangeNetwork("visa", "Visa", {{4, 4, 1}}, {13, 16, 19}, 3) {}

MastercardNetwork::MastercardNetwork()
    : PrefixRangeNetwork("mastercard", "Mastercard",
                         {{51, 55, 2}, {2221, 2720, 4}}, {16}, 3) {}

AmexNetwork::AmexNetwork()
    : PrefixRangeNetwork("amex", "American Express",
                         {{34, 34, 2}, {37, 37, 2}}, {15}, 4) {}

RuPayNetwork::RuPayNetwork()
    : PrefixRangeNetwork("rupay", "RuPay",
                         {{508500, 508999, 6}, {606985, 607984, 6},
                          {608001, 608500, 6}, {652150, 653149, 6}},
                         {16}, 3) {}

DiscoverNetwork::DiscoverNetwork()
    : PrefixRangeNetwork("discover", "Discover",
                         {{6011, 6011, 4}, {644, 649, 3}, {65, 65, 2},
                          {622126, 622925, 6}},
                         {16, 17, 18, 19}, 3) {}

NetworkRegistry NetworkRegistry::withDefaults() {
    NetworkRegistry reg;
    reg.add(std::make_unique<VisaNetwork>());
    reg.add(std::make_unique<MastercardNetwork>());
    reg.add(std::make_unique<AmexNetwork>());
    reg.add(std::make_unique<RuPayNetwork>());     // before Discover: overlaps 65xxxx
    reg.add(std::make_unique<DiscoverNetwork>());
    return reg;
}

void NetworkRegistry::add(std::unique_ptr<CardNetwork> network) {
    networks_.push_back(std::move(network));
}

const CardNetwork* NetworkRegistry::detect(std::string_view digits) const {
    for (const auto& n : networks_) {
        if (n->matchesPrefix(digits)) return n.get();
    }
    return nullptr;
}

const CardNetwork* NetworkRegistry::byId(std::string_view id) const {
    for (const auto& n : networks_) {
        if (n->id() == id) return n.get();
    }
    return nullptr;
}

}  // namespace payable
